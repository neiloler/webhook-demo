import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AuthenticatedSession } from "./auth-session.js";
import { config } from "./config.js";
import { database } from "./database.js";

const PUBLIC_INGEST_LIMIT = 100;
const PUBLIC_INGEST_BODY_LIMIT_BYTES = 64 * 1024;
const DELIVERY_TIMEOUT_MS = 3_000;
const RESPONSE_BODY_SAMPLE_LIMIT = 4_096;
const INBOUND_EVENT_STATUS = "accepted";
const DELIVERY_ATTEMPT_NUMBER = 1;

const DELIVERY_STATUSES = [
  "pending",
  "in_progress",
  "succeeded",
  "failed",
  "retrying",
] as const;

const DELIVERY_ATTEMPT_STATUSES = ["pending", "succeeded", "failed"] as const;

type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
type DeliveryAttemptStatus = (typeof DELIVERY_ATTEMPT_STATUSES)[number];

type SessionGuard = (
  request: FastifyRequest,
  reply: FastifyReply,
) => Promise<AuthenticatedSession | null>;

type IngestEndpointRow = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
};

type WebhookSubscriptionRow = {
  id: string;
  ingest_endpoint_id: string;
  user_id: string;
  target_url: string;
  description: string | null;
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
};

type InboundEventRow = {
  id: string;
  ingest_endpoint_id: string;
  user_id: string;
  payload: string;
  headers: string;
  received_at: string;
  status: string;
};

type WebhookDeliveryRow = {
  id: string;
  inbound_event_id: string;
  webhook_subscription_id: string;
  user_id: string;
  status: DeliveryStatus;
  next_attempt_at: string | null;
  created_at: string;
  updated_at: string;
};

type WebhookDeliveryAttemptRow = {
  id: string;
  webhook_delivery_id: string;
  attempt_number: number;
  status: DeliveryAttemptStatus;
  target_url: string;
  request_headers: string;
  request_body: string;
  response_status: number | null;
  response_headers: string | null;
  response_body: string | null;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
};

type IngestEndpoint = {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  publicIngestPath: string;
  publicIngestUrl: string;
  createdAt: string;
  updatedAt: string;
};

type WebhookSubscription = {
  id: string;
  ingestEndpointId: string;
  userId: string;
  targetUrl: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type InboundEvent = {
  id: string;
  ingestEndpointId: string;
  userId: string;
  payload: unknown;
  headers: unknown;
  receivedAt: string;
  status: string;
};

type WebhookDelivery = {
  id: string;
  inboundEventId: string;
  webhookSubscriptionId: string;
  userId: string;
  status: DeliveryStatus;
  nextAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type WebhookDeliveryAttempt = {
  id: string;
  webhookDeliveryId: string;
  attemptNumber: number;
  status: DeliveryAttemptStatus;
  targetUrl: string;
  requestHeaders: unknown;
  requestBody: unknown;
  responseStatus: number | null;
  responseHeaders: unknown;
  responseBody: string | null;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
};

type IdParams = {
  id: string;
};

type PublicIngestParams = {
  userId: string;
  uniqueIdentifier: string;
};

type InboundEventListQuery = {
  ingestEndpointId?: string;
};

type WebhookSubscriptionListQuery = {
  ingestEndpointId?: string;
};

type WebhookDeliveryListQuery = {
  inboundEventId?: string;
  status?: string;
  webhookSubscriptionId?: string;
};

type RateLimitWindow = {
  count: number;
  startedAt: number;
};

type DeliveryTarget = {
  deliveryId: string;
  subscription: WebhookSubscriptionRow;
};

const deliveryStatusSet = new Set<string>(DELIVERY_STATUSES);
const ingestRateLimitWindows = new Map<string, RateLimitWindow>();

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isNonEmptyRecord = (value: unknown): value is Record<string, unknown> => {
  return isRecord(value) && Object.keys(value).length > 0;
};

const isDeliveryStatus = (value: string): value is DeliveryStatus => {
  return deliveryStatusSet.has(value);
};

const sendError = (
  reply: FastifyReply,
  status: number,
  code: string,
  error: string,
) => {
  return reply.status(status).send({ code, error });
};

const nowIso = (): string => new Date().toISOString();

const toSqlBoolean = (value: boolean): 0 | 1 => (value ? 1 : 0);

const parseJson = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const parseNullableJson = (value: string | null): unknown => {
  return value === null ? null : parseJson(value);
};

const readRequiredText = (
  body: Record<string, unknown>,
  key: string,
): string | null => {
  const value = body[key];

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readOptionalText = (
  body: Record<string, unknown>,
  key: string,
): string | null | undefined => {
  if (!(key in body)) {
    return undefined;
  }

  const value = body[key];

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readOptionalBoolean = (
  body: Record<string, unknown>,
  key: string,
): boolean | undefined => {
  if (!(key in body)) {
    return undefined;
  }

  const value = body[key];
  return typeof value === "boolean" ? value : undefined;
};

const readHttpUrl = (
  body: Record<string, unknown>,
  key: string,
): string | null => {
  const value = body[key];

  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
};

const readQueryText = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const truncateText = (value: string, maxLength: number): string => {
  return value.length <= maxLength ? value : value.slice(0, maxLength);
};

const buildPublicIngestPath = (row: IngestEndpointRow): string => {
  return `/ingest/${encodeURIComponent(row.user_id)}/${encodeURIComponent(row.slug)}/events`;
};

const buildPublicIngestUrl = (row: IngestEndpointRow): string => {
  return new URL(buildPublicIngestPath(row), config.authUrl).toString();
};

const mapIngestEndpoint = (row: IngestEndpointRow): IngestEndpoint => ({
  createdAt: row.created_at,
  description: row.description,
  id: row.id,
  isActive: row.is_active === 1,
  name: row.name,
  publicIngestPath: buildPublicIngestPath(row),
  publicIngestUrl: buildPublicIngestUrl(row),
  slug: row.slug,
  updatedAt: row.updated_at,
  userId: row.user_id,
});

const mapWebhookSubscription = (
  row: WebhookSubscriptionRow,
): WebhookSubscription => ({
  createdAt: row.created_at,
  description: row.description,
  id: row.id,
  ingestEndpointId: row.ingest_endpoint_id,
  isActive: row.is_active === 1,
  targetUrl: row.target_url,
  updatedAt: row.updated_at,
  userId: row.user_id,
});

const mapInboundEvent = (row: InboundEventRow): InboundEvent => ({
  headers: parseJson(row.headers),
  id: row.id,
  ingestEndpointId: row.ingest_endpoint_id,
  payload: parseJson(row.payload),
  receivedAt: row.received_at,
  status: row.status,
  userId: row.user_id,
});

const mapWebhookDelivery = (row: WebhookDeliveryRow): WebhookDelivery => ({
  createdAt: row.created_at,
  id: row.id,
  inboundEventId: row.inbound_event_id,
  nextAttemptAt: row.next_attempt_at,
  status: row.status,
  updatedAt: row.updated_at,
  userId: row.user_id,
  webhookSubscriptionId: row.webhook_subscription_id,
});

const mapWebhookDeliveryAttempt = (
  row: WebhookDeliveryAttemptRow,
): WebhookDeliveryAttempt => ({
  attemptNumber: row.attempt_number,
  errorMessage: row.error_message,
  finishedAt: row.finished_at,
  id: row.id,
  requestBody: parseJson(row.request_body),
  requestHeaders: parseJson(row.request_headers),
  responseBody: row.response_body,
  responseHeaders: parseNullableJson(row.response_headers),
  responseStatus: row.response_status,
  startedAt: row.started_at,
  status: row.status,
  targetUrl: row.target_url,
  webhookDeliveryId: row.webhook_delivery_id,
});

const getUsefulInboundHeaders = (
  request: FastifyRequest,
): Record<string, string> => {
  const headerNames = [
    "content-type",
    "user-agent",
    "x-correlation-id",
    "x-forwarded-for",
    "x-request-id",
  ];

  return headerNames.reduce<Record<string, string>>((headers, name) => {
    const value = request.headers[name];

    if (Array.isArray(value)) {
      headers[name] = value.join(", ");
      return headers;
    }

    if (typeof value === "string") {
      headers[name] = value;
    }

    return headers;
  }, {});
};

const getSelectedResponseHeaders = (headers: Headers): Record<string, string> => {
  const headerNames = [
    "content-type",
    "date",
    "server",
    "x-correlation-id",
    "x-request-id",
  ];

  return headerNames.reduce<Record<string, string>>((selected, name) => {
    const value = headers.get(name);

    if (value) {
      selected[name] = value;
    }

    return selected;
  }, {});
};

const isAllowedPublicIngestRequest = (key: string): boolean => {
  const currentWindow = Math.floor(Date.now() / 1000);
  const existingWindow = ingestRateLimitWindows.get(key);

  if (!existingWindow || existingWindow.startedAt !== currentWindow) {
    ingestRateLimitWindows.set(key, { count: 1, startedAt: currentWindow });
    return true;
  }

  if (existingWindow.count >= PUBLIC_INGEST_LIMIT) {
    return false;
  }

  existingWindow.count += 1;
  return true;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.name === "AbortError") {
    return "Delivery request timed out.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Delivery request failed.";
};

const isUniqueConstraintError = (error: unknown): boolean => {
  return (
    isRecord(error) &&
    typeof error.code === "string" &&
    error.code.startsWith("SQLITE_CONSTRAINT")
  );
};

const findIngestEndpointForUser = (
  id: string,
  userId: string,
): IngestEndpointRow | undefined => {
  return database
    .prepare<{ id: string; userId: string }, IngestEndpointRow>(
      `
        SELECT *
        FROM ingest_endpoints
        WHERE id = @id
          AND user_id = @userId
      `,
    )
    .get({ id, userId });
};

const findIngestEndpointBySlugForUser = (
  slug: string,
  userId: string,
): IngestEndpointRow | undefined => {
  return database
    .prepare<{ slug: string; userId: string }, IngestEndpointRow>(
      `
        SELECT *
        FROM ingest_endpoints
        WHERE slug = @slug
          AND user_id = @userId
      `,
    )
    .get({ slug, userId });
};

const findIngestEndpointByPublicPath = (
  userId: string,
  slug: string,
): IngestEndpointRow | undefined => {
  return database
    .prepare<{ slug: string; userId: string }, IngestEndpointRow>(
      `
        SELECT *
        FROM ingest_endpoints
        WHERE slug = @slug
          AND user_id = @userId
      `,
    )
    .get({ slug, userId });
};

const findWebhookSubscriptionForUser = (
  id: string,
  userId: string,
): WebhookSubscriptionRow | undefined => {
  return database
    .prepare<{ id: string; userId: string }, WebhookSubscriptionRow>(
      `
        SELECT *
        FROM webhook_subscriptions
        WHERE id = @id
          AND user_id = @userId
      `,
    )
    .get({ id, userId });
};

const findWebhookDeliveryForUser = (
  id: string,
  userId: string,
): WebhookDeliveryRow | undefined => {
  return database
    .prepare<{ id: string; userId: string }, WebhookDeliveryRow>(
      `
        SELECT *
        FROM webhook_deliveries
        WHERE id = @id
          AND user_id = @userId
      `,
    )
    .get({ id, userId });
};

const listActiveSubscriptionsForEndpoint = (
  ingestEndpointId: string,
): WebhookSubscriptionRow[] => {
  return database
    .prepare<{ ingestEndpointId: string }, WebhookSubscriptionRow>(
      `
        SELECT *
        FROM webhook_subscriptions
        WHERE ingest_endpoint_id = @ingestEndpointId
          AND is_active = 1
        ORDER BY created_at ASC
      `,
    )
    .all({ ingestEndpointId });
};

const createInboundEventWithDeliveries = database.transaction(
  ({
    endpoint,
    headersJson,
    inboundEventId,
    payloadJson,
    receivedAt,
    subscriptions,
  }: {
    endpoint: IngestEndpointRow;
    headersJson: string;
    inboundEventId: string;
    payloadJson: string;
    receivedAt: string;
    subscriptions: WebhookSubscriptionRow[];
  }): DeliveryTarget[] => {
    database
      .prepare<{
        headers: string;
        id: string;
        ingestEndpointId: string;
        payload: string;
        receivedAt: string;
        status: string;
        userId: string;
      }>(
        `
          INSERT INTO inbound_events (
            id,
            ingest_endpoint_id,
            user_id,
            payload,
            headers,
            received_at,
            status
          )
          VALUES (
            @id,
            @ingestEndpointId,
            @userId,
            @payload,
            @headers,
            @receivedAt,
            @status
          )
        `,
      )
      .run({
        headers: headersJson,
        id: inboundEventId,
        ingestEndpointId: endpoint.id,
        payload: payloadJson,
        receivedAt,
        status: INBOUND_EVENT_STATUS,
        userId: endpoint.user_id,
      });

    return subscriptions.map((subscription) => {
      const deliveryId = randomUUID();

      database
        .prepare<{
          createdAt: string;
          id: string;
          inboundEventId: string;
          status: DeliveryStatus;
          updatedAt: string;
          userId: string;
          webhookSubscriptionId: string;
        }>(
          `
            INSERT INTO webhook_deliveries (
              id,
              inbound_event_id,
              webhook_subscription_id,
              user_id,
              status,
              next_attempt_at,
              created_at,
              updated_at
            )
            VALUES (
              @id,
              @inboundEventId,
              @webhookSubscriptionId,
              @userId,
              @status,
              NULL,
              @createdAt,
              @updatedAt
            )
          `,
        )
        .run({
          createdAt: receivedAt,
          id: deliveryId,
          inboundEventId,
          status: "pending",
          updatedAt: receivedAt,
          userId: endpoint.user_id,
          webhookSubscriptionId: subscription.id,
        });

      return { deliveryId, subscription };
    });
  },
);

const updateDeliveryStatus = (
  deliveryId: string,
  status: DeliveryStatus,
): void => {
  database
    .prepare<{ id: string; status: DeliveryStatus; updatedAt: string }>(
      `
        UPDATE webhook_deliveries
        SET status = @status,
          updated_at = @updatedAt
        WHERE id = @id
      `,
    )
    .run({
      id: deliveryId,
      status,
      updatedAt: nowIso(),
    });
};

const recordDeliveryAttempt = database.transaction(
  ({
    attemptId,
    deliveryId,
    errorMessage,
    finishedAt,
    requestBody,
    requestHeaders,
    responseBody,
    responseHeaders,
    responseStatus,
    status,
    targetUrl,
    updatedDeliveryStatus,
    startedAt,
  }: {
    attemptId: string;
    deliveryId: string;
    errorMessage: string | null;
    finishedAt: string;
    requestBody: string;
    requestHeaders: string;
    responseBody: string | null;
    responseHeaders: string | null;
    responseStatus: number | null;
    startedAt: string;
    status: DeliveryAttemptStatus;
    targetUrl: string;
    updatedDeliveryStatus: DeliveryStatus;
  }): void => {
    database
      .prepare<{
        attemptNumber: number;
        errorMessage: string | null;
        finishedAt: string;
        id: string;
        requestBody: string;
        requestHeaders: string;
        responseBody: string | null;
        responseHeaders: string | null;
        responseStatus: number | null;
        startedAt: string;
        status: DeliveryAttemptStatus;
        targetUrl: string;
        webhookDeliveryId: string;
      }>(
        `
          INSERT INTO webhook_delivery_attempts (
            id,
            webhook_delivery_id,
            attempt_number,
            status,
            target_url,
            request_headers,
            request_body,
            response_status,
            response_headers,
            response_body,
            error_message,
            started_at,
            finished_at
          )
          VALUES (
            @id,
            @webhookDeliveryId,
            @attemptNumber,
            @status,
            @targetUrl,
            @requestHeaders,
            @requestBody,
            @responseStatus,
            @responseHeaders,
            @responseBody,
            @errorMessage,
            @startedAt,
            @finishedAt
          )
        `,
      )
      .run({
        attemptNumber: DELIVERY_ATTEMPT_NUMBER,
        errorMessage,
        finishedAt,
        id: attemptId,
        requestBody,
        requestHeaders,
        responseBody,
        responseHeaders,
        responseStatus,
        startedAt,
        status,
        targetUrl,
        webhookDeliveryId: deliveryId,
      });

    database
      .prepare<{ id: string; status: DeliveryStatus; updatedAt: string }>(
        `
          UPDATE webhook_deliveries
          SET status = @status,
            updated_at = @updatedAt
          WHERE id = @id
        `,
      )
      .run({
        id: deliveryId,
        status: updatedDeliveryStatus,
        updatedAt: finishedAt,
      });
  },
);

const attemptWebhookDelivery = async ({
  delivery,
  endpoint,
  inboundEventId,
  payloadJson,
}: {
  delivery: DeliveryTarget;
  endpoint: IngestEndpointRow;
  inboundEventId: string;
  payloadJson: string;
}): Promise<void> => {
  updateDeliveryStatus(delivery.deliveryId, "in_progress");

  const startedAt = nowIso();
  const requestHeaders = {
    "Content-Type": "application/json",
    "X-Inbound-Event-Id": inboundEventId,
    "X-Ingest-Endpoint-Id": endpoint.id,
    "X-Webhook-Delivery-Id": delivery.deliveryId,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

  let attemptStatus: DeliveryAttemptStatus = "failed";
  let responseStatus: number | null = null;
  let responseHeaders: string | null = null;
  let responseBody: string | null = null;
  let errorMessage: string | null = null;

  try {
    const response = await fetch(delivery.subscription.target_url, {
      body: payloadJson,
      headers: requestHeaders,
      method: "POST",
      signal: controller.signal,
    });

    responseStatus = response.status;
    responseHeaders = JSON.stringify(getSelectedResponseHeaders(response.headers));
    responseBody = truncateText(await response.text(), RESPONSE_BODY_SAMPLE_LIMIT);
    attemptStatus = response.ok ? "succeeded" : "failed";
  } catch (error) {
    errorMessage = getErrorMessage(error);
  } finally {
    clearTimeout(timeout);
  }

  const finishedAt = nowIso();

  recordDeliveryAttempt({
    attemptId: randomUUID(),
    deliveryId: delivery.deliveryId,
    errorMessage,
    finishedAt,
    requestBody: payloadJson,
    requestHeaders: JSON.stringify(requestHeaders),
    responseBody,
    responseHeaders,
    responseStatus,
    startedAt,
    status: attemptStatus,
    targetUrl: delivery.subscription.target_url,
    updatedDeliveryStatus: attemptStatus === "succeeded" ? "succeeded" : "failed",
  });
};

export const registerWebhookRoutes = (
  server: FastifyInstance,
  requireSession: SessionGuard,
): void => {
  server.post("/api/ingest-endpoints", async (request, reply) => {
    const session = await requireSession(request, reply);

    if (!session) {
      return;
    }

    if (!isRecord(request.body)) {
      return sendError(reply, 400, "INVALID_REQUEST_BODY", "Expected a JSON object.");
    }

    const name = readRequiredText(request.body, "name");

    if (!name) {
      return sendError(reply, 400, "NAME_REQUIRED", "A non-empty name is required.");
    }

    const uniqueIdentifierSource = "uniqueIdentifier" in request.body
      ? readRequiredText(request.body, "uniqueIdentifier")
      : name;

    if (!uniqueIdentifierSource) {
      return sendError(
        reply,
        400,
        "INVALID_UNIQUE_IDENTIFIER",
        "uniqueIdentifier must produce a non-empty slug.",
      );
    }

    const slug = slugify(uniqueIdentifierSource);

    if (!slug) {
      return sendError(
        reply,
        400,
        "INVALID_UNIQUE_IDENTIFIER",
        "uniqueIdentifier must produce a non-empty slug.",
      );
    }

    if (findIngestEndpointBySlugForUser(slug, session.user.id)) {
      return sendError(
        reply,
        409,
        "INGEST_ENDPOINT_SLUG_EXISTS",
        "An ingest endpoint with this slug already exists.",
      );
    }

    const description = readOptionalText(request.body, "description");

    if (description === undefined && "description" in request.body) {
      return sendError(
        reply,
        400,
        "INVALID_DESCRIPTION",
        "Description must be a string or null.",
      );
    }

    const id = randomUUID();
    const timestamp = nowIso();

    try {
      database
        .prepare<{
          createdAt: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          updatedAt: string;
          userId: string;
        }>(
          `
            INSERT INTO ingest_endpoints (
              id,
              user_id,
              name,
              slug,
              description,
              is_active,
              created_at,
              updated_at
            )
            VALUES (
              @id,
              @userId,
              @name,
              @slug,
              @description,
              1,
              @createdAt,
              @updatedAt
            )
          `,
        )
        .run({
          createdAt: timestamp,
          description: description ?? null,
          id,
          name,
          slug,
          updatedAt: timestamp,
          userId: session.user.id,
        });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return sendError(
          reply,
          409,
          "INGEST_ENDPOINT_SLUG_EXISTS",
          "An ingest endpoint with this slug already exists.",
        );
      }

      throw error;
    }

    const row = findIngestEndpointForUser(id, session.user.id);

    if (!row) {
      return sendError(
        reply,
        500,
        "INGEST_ENDPOINT_CREATE_FAILED",
        "Ingest endpoint was not created.",
      );
    }

    return reply.status(201).send({ ingestEndpoint: mapIngestEndpoint(row) });
  });

  server.get("/api/ingest-endpoints", async (request, reply) => {
    const session = await requireSession(request, reply);

    if (!session) {
      return;
    }

    const rows = database
      .prepare<{ userId: string }, IngestEndpointRow>(
        `
          SELECT *
          FROM ingest_endpoints
          WHERE user_id = @userId
          ORDER BY created_at DESC
        `,
      )
      .all({ userId: session.user.id });

    return { ingestEndpoints: rows.map(mapIngestEndpoint) };
  });

  server.get<{ Params: IdParams }>("/api/ingest-endpoints/:id", async (request, reply) => {
    const session = await requireSession(request, reply);

    if (!session) {
      return;
    }

    const row = findIngestEndpointForUser(request.params.id, session.user.id);

    if (!row) {
      return sendError(reply, 404, "INGEST_ENDPOINT_NOT_FOUND", "Ingest endpoint not found.");
    }

    return { ingestEndpoint: mapIngestEndpoint(row) };
  });

  server.patch<{ Params: IdParams }>(
    "/api/ingest-endpoints/:id",
    async (request, reply) => {
      const session = await requireSession(request, reply);

      if (!session) {
        return;
      }

      if (!isRecord(request.body)) {
        return sendError(reply, 400, "INVALID_REQUEST_BODY", "Expected a JSON object.");
      }

      const current = findIngestEndpointForUser(request.params.id, session.user.id);

      if (!current) {
        return sendError(reply, 404, "INGEST_ENDPOINT_NOT_FOUND", "Ingest endpoint not found.");
      }

      const hasName = "name" in request.body;
      const hasDescription = "description" in request.body;
      const hasIsActive = "isActive" in request.body;

      if (!hasName && !hasDescription && !hasIsActive) {
        return sendError(reply, 400, "NO_FIELDS_TO_UPDATE", "No mutable fields were provided.");
      }

      const name = hasName ? readRequiredText(request.body, "name") : current.name;

      if (!name) {
        return sendError(reply, 400, "INVALID_NAME", "Name must be a non-empty string.");
      }

      const description = hasDescription
        ? readOptionalText(request.body, "description")
        : current.description;

      if (description === undefined) {
        return sendError(
          reply,
          400,
          "INVALID_DESCRIPTION",
          "Description must be a string or null.",
        );
      }

      const isActive = hasIsActive
        ? readOptionalBoolean(request.body, "isActive")
        : current.is_active === 1;

      if (isActive === undefined) {
        return sendError(reply, 400, "INVALID_IS_ACTIVE", "isActive must be a boolean.");
      }

      const timestamp = nowIso();
      const updateEndpoint = database.transaction(() => {
        database
          .prepare<{
            description: string | null;
            id: string;
            isActive: 0 | 1;
            name: string;
            updatedAt: string;
            userId: string;
          }>(
            `
              UPDATE ingest_endpoints
              SET name = @name,
                description = @description,
                is_active = @isActive,
                updated_at = @updatedAt
              WHERE id = @id
                AND user_id = @userId
            `,
          )
          .run({
            description,
            id: request.params.id,
            isActive: toSqlBoolean(isActive),
            name,
            updatedAt: timestamp,
            userId: session.user.id,
          });

        if (!isActive) {
          database
            .prepare<{ ingestEndpointId: string; updatedAt: string; userId: string }>(
              `
                UPDATE webhook_subscriptions
                SET is_active = 0,
                  updated_at = @updatedAt
                WHERE ingest_endpoint_id = @ingestEndpointId
                  AND user_id = @userId
              `,
            )
            .run({
              ingestEndpointId: request.params.id,
              updatedAt: timestamp,
              userId: session.user.id,
            });
        }
      });

      updateEndpoint();

      const updated = findIngestEndpointForUser(request.params.id, session.user.id);

      if (!updated) {
        return sendError(reply, 404, "INGEST_ENDPOINT_NOT_FOUND", "Ingest endpoint not found.");
      }

      return { ingestEndpoint: mapIngestEndpoint(updated) };
    },
  );

  server.post<{ Params: IdParams }>(
    "/api/ingest-endpoints/:id/subscriptions",
    async (request, reply) => {
      const session = await requireSession(request, reply);

      if (!session) {
        return;
      }

      if (!isRecord(request.body)) {
        return sendError(reply, 400, "INVALID_REQUEST_BODY", "Expected a JSON object.");
      }

      const parentEndpoint = findIngestEndpointForUser(request.params.id, session.user.id);

      if (!parentEndpoint) {
        return sendError(reply, 404, "INGEST_ENDPOINT_NOT_FOUND", "Ingest endpoint not found.");
      }

      const targetUrl = readHttpUrl(request.body, "targetUrl");

      if (!targetUrl) {
        return sendError(
          reply,
          400,
          "INVALID_TARGET_URL",
          "A valid http or https targetUrl is required.",
        );
      }

      const description = readOptionalText(request.body, "description");

      if (description === undefined && "description" in request.body) {
        return sendError(
          reply,
          400,
          "INVALID_DESCRIPTION",
          "Description must be a string or null.",
        );
      }

      const requestedIsActive = readOptionalBoolean(request.body, "isActive");

      if (requestedIsActive === undefined && "isActive" in request.body) {
        return sendError(reply, 400, "INVALID_IS_ACTIVE", "isActive must be a boolean.");
      }

      const isActive = requestedIsActive ?? true;

      if (isActive && parentEndpoint.is_active === 0) {
        return sendError(
          reply,
          400,
          "INGEST_ENDPOINT_INACTIVE",
          "Webhook subscriptions cannot be active for inactive ingest endpoints.",
        );
      }

      const id = randomUUID();
      const timestamp = nowIso();

      database
        .prepare<{
          createdAt: string;
          description: string | null;
          id: string;
          ingestEndpointId: string;
          isActive: 0 | 1;
          targetUrl: string;
          updatedAt: string;
          userId: string;
        }>(
          `
            INSERT INTO webhook_subscriptions (
              id,
              ingest_endpoint_id,
              user_id,
              target_url,
              description,
              is_active,
              created_at,
              updated_at
            )
            VALUES (
              @id,
              @ingestEndpointId,
              @userId,
              @targetUrl,
              @description,
              @isActive,
              @createdAt,
              @updatedAt
            )
          `,
        )
        .run({
          createdAt: timestamp,
          description: description ?? null,
          id,
          ingestEndpointId: parentEndpoint.id,
          isActive: toSqlBoolean(isActive),
          targetUrl,
          updatedAt: timestamp,
          userId: session.user.id,
        });

      const row = findWebhookSubscriptionForUser(id, session.user.id);

      if (!row) {
        return sendError(
          reply,
          500,
          "WEBHOOK_SUBSCRIPTION_CREATE_FAILED",
          "Webhook subscription was not created.",
        );
      }

      return reply.status(201).send({ webhookSubscription: mapWebhookSubscription(row) });
    },
  );

  server.get<{ Params: IdParams }>(
    "/api/ingest-endpoints/:id/subscriptions",
    async (request, reply) => {
      const session = await requireSession(request, reply);

      if (!session) {
        return;
      }

      const parentEndpoint = findIngestEndpointForUser(request.params.id, session.user.id);

      if (!parentEndpoint) {
        return sendError(reply, 404, "INGEST_ENDPOINT_NOT_FOUND", "Ingest endpoint not found.");
      }

      const rows = database
        .prepare<{ ingestEndpointId: string; userId: string }, WebhookSubscriptionRow>(
          `
            SELECT *
            FROM webhook_subscriptions
            WHERE ingest_endpoint_id = @ingestEndpointId
              AND user_id = @userId
            ORDER BY created_at DESC
          `,
        )
        .all({ ingestEndpointId: parentEndpoint.id, userId: session.user.id });

      return { webhookSubscriptions: rows.map(mapWebhookSubscription) };
    },
  );

  server.get<{ Querystring: WebhookSubscriptionListQuery }>(
    "/api/webhook-subscriptions",
    async (request, reply) => {
      const session = await requireSession(request, reply);

      if (!session) {
        return;
      }

      const ingestEndpointId = readQueryText(request.query.ingestEndpointId);

      const rows = ingestEndpointId
        ? database
            .prepare<
              { ingestEndpointId: string; userId: string },
              WebhookSubscriptionRow
            >(
              `
                SELECT *
                FROM webhook_subscriptions
                WHERE user_id = @userId
                  AND ingest_endpoint_id = @ingestEndpointId
                ORDER BY created_at DESC
              `,
            )
            .all({ ingestEndpointId, userId: session.user.id })
        : database
            .prepare<{ userId: string }, WebhookSubscriptionRow>(
              `
                SELECT *
                FROM webhook_subscriptions
                WHERE user_id = @userId
                ORDER BY created_at DESC
              `,
            )
            .all({ userId: session.user.id });

      return { webhookSubscriptions: rows.map(mapWebhookSubscription) };
    },
  );

  server.get<{ Params: IdParams }>("/api/webhook-subscriptions/:id", async (request, reply) => {
    const session = await requireSession(request, reply);

    if (!session) {
      return;
    }

    const row = findWebhookSubscriptionForUser(request.params.id, session.user.id);

    if (!row) {
      return sendError(
        reply,
        404,
        "WEBHOOK_SUBSCRIPTION_NOT_FOUND",
        "Webhook subscription not found.",
      );
    }

    return { webhookSubscription: mapWebhookSubscription(row) };
  });

  server.patch<{ Params: IdParams }>(
    "/api/webhook-subscriptions/:id",
    async (request, reply) => {
      const session = await requireSession(request, reply);

      if (!session) {
        return;
      }

      if (!isRecord(request.body)) {
        return sendError(reply, 400, "INVALID_REQUEST_BODY", "Expected a JSON object.");
      }

      const current = findWebhookSubscriptionForUser(request.params.id, session.user.id);

      if (!current) {
        return sendError(
          reply,
          404,
          "WEBHOOK_SUBSCRIPTION_NOT_FOUND",
          "Webhook subscription not found.",
        );
      }

      const hasTargetUrl = "targetUrl" in request.body;
      const hasDescription = "description" in request.body;
      const hasIsActive = "isActive" in request.body;

      if (!hasTargetUrl && !hasDescription && !hasIsActive) {
        return sendError(reply, 400, "NO_FIELDS_TO_UPDATE", "No mutable fields were provided.");
      }

      const targetUrl = hasTargetUrl
        ? readHttpUrl(request.body, "targetUrl")
        : current.target_url;

      if (!targetUrl) {
        return sendError(
          reply,
          400,
          "INVALID_TARGET_URL",
          "A valid http or https targetUrl is required.",
        );
      }

      const description = hasDescription
        ? readOptionalText(request.body, "description")
        : current.description;

      if (description === undefined) {
        return sendError(
          reply,
          400,
          "INVALID_DESCRIPTION",
          "Description must be a string or null.",
        );
      }

      const isActive = hasIsActive
        ? readOptionalBoolean(request.body, "isActive")
        : current.is_active === 1;

      if (isActive === undefined) {
        return sendError(reply, 400, "INVALID_IS_ACTIVE", "isActive must be a boolean.");
      }

      if (isActive) {
        const parentEndpoint = findIngestEndpointForUser(
          current.ingest_endpoint_id,
          session.user.id,
        );

        if (!parentEndpoint || parentEndpoint.is_active === 0) {
          return sendError(
            reply,
            400,
            "INGEST_ENDPOINT_INACTIVE",
            "Webhook subscriptions cannot be active for inactive ingest endpoints.",
          );
        }
      }

      database
        .prepare<{
          description: string | null;
          id: string;
          isActive: 0 | 1;
          targetUrl: string;
          updatedAt: string;
          userId: string;
        }>(
          `
            UPDATE webhook_subscriptions
            SET target_url = @targetUrl,
              description = @description,
              is_active = @isActive,
              updated_at = @updatedAt
            WHERE id = @id
              AND user_id = @userId
          `,
        )
        .run({
          description,
          id: request.params.id,
          isActive: toSqlBoolean(isActive),
          targetUrl,
          updatedAt: nowIso(),
          userId: session.user.id,
        });

      const row = findWebhookSubscriptionForUser(request.params.id, session.user.id);

      if (!row) {
        return sendError(
          reply,
          404,
          "WEBHOOK_SUBSCRIPTION_NOT_FOUND",
          "Webhook subscription not found.",
        );
      }

      return { webhookSubscription: mapWebhookSubscription(row) };
    },
  );

  server.post<{ Params: PublicIngestParams }>(
    "/ingest/:userId/:uniqueIdentifier/events",
    { bodyLimit: PUBLIC_INGEST_BODY_LIMIT_BYTES },
    async (request, reply) => {
      const userId = request.params.userId.trim();
      const slug = slugify(request.params.uniqueIdentifier);
      const rateLimitKey = `${userId}:${slug || request.params.uniqueIdentifier}`;

      if (!isAllowedPublicIngestRequest(rateLimitKey)) {
        return sendError(
          reply,
          429,
          "INGEST_RATE_LIMITED",
          "Public ingestion is limited to 100 requests per second.",
        );
      }

      if (!isNonEmptyRecord(request.body)) {
        return sendError(
          reply,
          400,
          "INVALID_EVENT_PAYLOAD",
          "Expected a non-empty JSON object payload.",
        );
      }

      const endpoint = userId && slug
        ? findIngestEndpointByPublicPath(userId, slug)
        : undefined;

      if (!endpoint) {
        return sendError(reply, 404, "INGEST_ENDPOINT_NOT_FOUND", "Ingest endpoint not found.");
      }

      if (endpoint.is_active === 0) {
        return sendError(
          reply,
          400,
          "INGEST_ENDPOINT_INACTIVE",
          "Ingest endpoint is inactive.",
        );
      }

      const inboundEventId = randomUUID();
      const receivedAt = nowIso();
      const payloadJson = JSON.stringify(request.body);
      const headersJson = JSON.stringify(getUsefulInboundHeaders(request));
      const subscriptions = listActiveSubscriptionsForEndpoint(endpoint.id);
      const deliveries = createInboundEventWithDeliveries({
        endpoint,
        headersJson,
        inboundEventId,
        payloadJson,
        receivedAt,
        subscriptions,
      });

      await Promise.all(
        deliveries.map((delivery) =>
          attemptWebhookDelivery({
            delivery,
            endpoint,
            inboundEventId,
            payloadJson,
          }),
        ),
      );

      return reply.status(201).send({
        event: {
          attemptedDeliveryCount: deliveries.length,
          deliveryCount: deliveries.length,
          id: inboundEventId,
          status: INBOUND_EVENT_STATUS,
        },
      });
    },
  );

  server.get<{ Querystring: InboundEventListQuery }>("/api/inbound-events", async (request, reply) => {
    const session = await requireSession(request, reply);

    if (!session) {
      return;
    }

    const ingestEndpointId = readQueryText(request.query.ingestEndpointId);

    const rows = ingestEndpointId
      ? database
          .prepare<{ ingestEndpointId: string; userId: string }, InboundEventRow>(
            `
              SELECT *
              FROM inbound_events
              WHERE user_id = @userId
                AND ingest_endpoint_id = @ingestEndpointId
              ORDER BY received_at DESC
              LIMIT 100
            `,
          )
          .all({ ingestEndpointId, userId: session.user.id })
      : database
          .prepare<{ userId: string }, InboundEventRow>(
            `
              SELECT *
              FROM inbound_events
              WHERE user_id = @userId
              ORDER BY received_at DESC
              LIMIT 100
            `,
          )
          .all({ userId: session.user.id });

    return { inboundEvents: rows.map(mapInboundEvent) };
  });

  server.get<{ Params: IdParams }>("/api/inbound-events/:id", async (request, reply) => {
    const session = await requireSession(request, reply);

    if (!session) {
      return;
    }

    const row = database
      .prepare<{ id: string; userId: string }, InboundEventRow>(
        `
          SELECT *
          FROM inbound_events
          WHERE id = @id
            AND user_id = @userId
        `,
      )
      .get({ id: request.params.id, userId: session.user.id });

    if (!row) {
      return sendError(reply, 404, "INBOUND_EVENT_NOT_FOUND", "Inbound event not found.");
    }

    return { inboundEvent: mapInboundEvent(row) };
  });

  server.get<{ Querystring: WebhookDeliveryListQuery }>(
    "/api/webhook-deliveries",
    async (request, reply) => {
      const session = await requireSession(request, reply);

      if (!session) {
        return;
      }

      const inboundEventId = readQueryText(request.query.inboundEventId);
      const webhookSubscriptionId = readQueryText(request.query.webhookSubscriptionId);
      const status = readQueryText(request.query.status);

      if (status && !isDeliveryStatus(status)) {
        return sendError(reply, 400, "INVALID_DELIVERY_STATUS", "Unknown delivery status.");
      }

      const conditions = ["user_id = @userId"];
      const params: Record<string, string> = { userId: session.user.id };

      if (inboundEventId) {
        conditions.push("inbound_event_id = @inboundEventId");
        params.inboundEventId = inboundEventId;
      }

      if (webhookSubscriptionId) {
        conditions.push("webhook_subscription_id = @webhookSubscriptionId");
        params.webhookSubscriptionId = webhookSubscriptionId;
      }

      if (status) {
        conditions.push("status = @status");
        params.status = status;
      }

      const rows = database
        .prepare<Record<string, string>, WebhookDeliveryRow>(
          `
            SELECT *
            FROM webhook_deliveries
            WHERE ${conditions.join(" AND ")}
            ORDER BY created_at DESC
            LIMIT 100
          `,
        )
        .all(params);

      return { webhookDeliveries: rows.map(mapWebhookDelivery) };
    },
  );

  server.get<{ Params: IdParams }>("/api/webhook-deliveries/:id", async (request, reply) => {
    const session = await requireSession(request, reply);

    if (!session) {
      return;
    }

    const row = findWebhookDeliveryForUser(request.params.id, session.user.id);

    if (!row) {
      return sendError(
        reply,
        404,
        "WEBHOOK_DELIVERY_NOT_FOUND",
        "Webhook delivery not found.",
      );
    }

    return { webhookDelivery: mapWebhookDelivery(row) };
  });

  server.get<{ Params: IdParams }>(
    "/api/webhook-deliveries/:id/attempts",
    async (request, reply) => {
      const session = await requireSession(request, reply);

      if (!session) {
        return;
      }

      const delivery = findWebhookDeliveryForUser(request.params.id, session.user.id);

      if (!delivery) {
        return sendError(
          reply,
          404,
          "WEBHOOK_DELIVERY_NOT_FOUND",
          "Webhook delivery not found.",
        );
      }

      const rows = database
        .prepare<{ webhookDeliveryId: string }, WebhookDeliveryAttemptRow>(
          `
            SELECT *
            FROM webhook_delivery_attempts
            WHERE webhook_delivery_id = @webhookDeliveryId
            ORDER BY attempt_number ASC
          `,
        )
        .all({ webhookDeliveryId: delivery.id });

      return { webhookDeliveryAttempts: rows.map(mapWebhookDeliveryAttempt) };
    },
  );
};
