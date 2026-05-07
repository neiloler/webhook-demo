import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AuthenticatedSession } from "./auth-session.js";
import { database } from "./database.js";

const EVENT_INGESTION_LIMIT = 100;
const EVENT_BODY_LIMIT_BYTES = 64 * 1024;
const RECEIVED_STATUS = "received";

type SessionGuard = (
  request: FastifyRequest,
  reply: FastifyReply,
) => Promise<AuthenticatedSession | null>;

type WebhookEventRow = {
  webhook_registration_id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
};

type WebhookRegistrationRow = {
  id: string;
  webhook_registration_id: string;
  user_id: string;
  url: string;
  description: string | null;
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
};

type EventOccurrenceRow = {
  id: string;
  webhook_registration_id: string;
  user_id: string;
  payload: string;
  headers: string;
  received_at: string;
  status: string;
};

type WebhookEvent = {
  webhookRegistrationId: string;
  userId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type WebhookRegistration = {
  id: string;
  webhookRegistrationId: string;
  userId: string;
  url: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type EventOccurrence = {
  id: string;
  webhookRegistrationId: string;
  userId: string;
  payload: unknown;
  headers: unknown;
  receivedAt: string;
  status: string;
};

type WebhookEventParams = {
  webhookRegistrationId: string;
};

type IdParams = {
  id: string;
};

type WebhookListQuery = {
  webhookRegistrationId?: string;
};

let eventWindowStartedAt = 0;
let eventWindowCount = 0;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

const mapWebhookEvent = (row: WebhookEventRow): WebhookEvent => ({
  createdAt: row.created_at,
  description: row.description,
  isActive: row.is_active === 1,
  name: row.name,
  updatedAt: row.updated_at,
  userId: row.user_id,
  webhookRegistrationId: row.webhook_registration_id,
});

const mapWebhookRegistration = (
  row: WebhookRegistrationRow,
): WebhookRegistration => ({
  createdAt: row.created_at,
  description: row.description,
  id: row.id,
  isActive: row.is_active === 1,
  updatedAt: row.updated_at,
  url: row.url,
  userId: row.user_id,
  webhookRegistrationId: row.webhook_registration_id,
});

const mapEventOccurrence = (row: EventOccurrenceRow): EventOccurrence => ({
  headers: parseJson(row.headers),
  id: row.id,
  payload: parseJson(row.payload),
  receivedAt: row.received_at,
  status: row.status,
  userId: row.user_id,
  webhookRegistrationId: row.webhook_registration_id,
});

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

const readWebhookRegistrationId = (
  body: Record<string, unknown>,
): string | null => {
  const value = body.webhookRegistrationId;

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readHttpUrl = (body: Record<string, unknown>): string | null => {
  const value = body.url;

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

const isAllowedEventRequest = (): boolean => {
  const currentWindow = Math.floor(Date.now() / 1000);

  if (currentWindow !== eventWindowStartedAt) {
    eventWindowStartedAt = currentWindow;
    eventWindowCount = 0;
  }

  if (eventWindowCount >= EVENT_INGESTION_LIMIT) {
    return false;
  }

  eventWindowCount += 1;
  return true;
};

const getUsefulHeaders = (request: FastifyRequest): Record<string, string> => {
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

const findWebhookEventForUser = (
  webhookRegistrationId: string,
  userId: string,
): WebhookEventRow | undefined => {
  return database
    .prepare<
      { userId: string; webhookRegistrationId: string },
      WebhookEventRow
    >(
      `
        SELECT *
        FROM webhook_events
        WHERE webhook_registration_id = @webhookRegistrationId
          AND user_id = @userId
      `,
    )
    .get({ userId, webhookRegistrationId });
};

const findWebhookEvent = (
  webhookRegistrationId: string,
): WebhookEventRow | undefined => {
  return database
    .prepare<{ webhookRegistrationId: string }, WebhookEventRow>(
      `
        SELECT *
        FROM webhook_events
        WHERE webhook_registration_id = @webhookRegistrationId
      `,
    )
    .get({ webhookRegistrationId });
};

const findWebhookRegistrationForUser = (
  id: string,
  userId: string,
): WebhookRegistrationRow | undefined => {
  return database
    .prepare<{ id: string; userId: string }, WebhookRegistrationRow>(
      `
        SELECT *
        FROM webhook_registrations
        WHERE id = @id
          AND user_id = @userId
      `,
    )
    .get({ id, userId });
};

export const registerWebhookRoutes = (
  server: FastifyInstance,
  requireSession: SessionGuard,
): void => {
  server.post("/api/webhook-events", async (request, reply) => {
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

    const description = readOptionalText(request.body, "description");

    if (description === undefined && "description" in request.body) {
      return sendError(
        reply,
        400,
        "INVALID_DESCRIPTION",
        "Description must be a string or null.",
      );
    }

    const timestamp = nowIso();
    const webhookRegistrationId = randomUUID();

    database
      .prepare<
        {
          createdAt: string;
          description: string | null;
          name: string;
          updatedAt: string;
          userId: string;
          webhookRegistrationId: string;
        }
      >(
        `
          INSERT INTO webhook_events (
            webhook_registration_id,
            user_id,
            name,
            description,
            is_active,
            created_at,
            updated_at
          )
          VALUES (
            @webhookRegistrationId,
            @userId,
            @name,
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
        name,
        updatedAt: timestamp,
        userId: session.user.id,
        webhookRegistrationId,
      });

    const row = findWebhookEventForUser(webhookRegistrationId, session.user.id);

    if (!row) {
      return sendError(reply, 500, "WEBHOOK_EVENT_CREATE_FAILED", "Webhook event was not created.");
    }

    return reply.status(201).send({ webhookEvent: mapWebhookEvent(row) });
  });

  server.get("/api/webhook-events", async (request, reply) => {
    const session = await requireSession(request, reply);

    if (!session) {
      return;
    }

    const rows = database
      .prepare<{ userId: string }, WebhookEventRow>(
        `
          SELECT *
          FROM webhook_events
          WHERE user_id = @userId
          ORDER BY created_at DESC
        `,
      )
      .all({ userId: session.user.id });

    return { webhookEvents: rows.map(mapWebhookEvent) };
  });

  server.get<{ Params: WebhookEventParams }>(
    "/api/webhook-events/:webhookRegistrationId",
    async (request, reply) => {
      const session = await requireSession(request, reply);

      if (!session) {
        return;
      }

      const row = findWebhookEventForUser(
        request.params.webhookRegistrationId,
        session.user.id,
      );

      if (!row) {
        return sendError(reply, 404, "WEBHOOK_EVENT_NOT_FOUND", "Webhook event not found.");
      }

      return { webhookEvent: mapWebhookEvent(row) };
    },
  );

  server.patch<{ Params: WebhookEventParams }>(
    "/api/webhook-events/:webhookRegistrationId",
    async (request, reply) => {
      const session = await requireSession(request, reply);

      if (!session) {
        return;
      }

      if (!isRecord(request.body)) {
        return sendError(reply, 400, "INVALID_REQUEST_BODY", "Expected a JSON object.");
      }

      const current = findWebhookEventForUser(
        request.params.webhookRegistrationId,
        session.user.id,
      );

      if (!current) {
        return sendError(reply, 404, "WEBHOOK_EVENT_NOT_FOUND", "Webhook event not found.");
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

      const updateEvent = database.transaction(() => {
        database
          .prepare<
            {
              description: string | null;
              isActive: 0 | 1;
              name: string;
              updatedAt: string;
              userId: string;
              webhookRegistrationId: string;
            }
          >(
            `
              UPDATE webhook_events
              SET name = @name,
                description = @description,
                is_active = @isActive,
                updated_at = @updatedAt
              WHERE webhook_registration_id = @webhookRegistrationId
                AND user_id = @userId
            `,
          )
          .run({
            description,
            isActive: toSqlBoolean(isActive),
            name,
            updatedAt: nowIso(),
            userId: session.user.id,
            webhookRegistrationId: request.params.webhookRegistrationId,
          });

        if (!isActive) {
          database
            .prepare<
              {
                updatedAt: string;
                userId: string;
                webhookRegistrationId: string;
              }
            >(
              `
                UPDATE webhook_registrations
                SET is_active = 0,
                  updated_at = @updatedAt
                WHERE webhook_registration_id = @webhookRegistrationId
                  AND user_id = @userId
              `,
            )
            .run({
              updatedAt: nowIso(),
              userId: session.user.id,
              webhookRegistrationId: request.params.webhookRegistrationId,
            });
        }
      });

      updateEvent();

      const updated = findWebhookEventForUser(
        request.params.webhookRegistrationId,
        session.user.id,
      );

      if (!updated) {
        return sendError(reply, 404, "WEBHOOK_EVENT_NOT_FOUND", "Webhook event not found.");
      }

      return { webhookEvent: mapWebhookEvent(updated) };
    },
  );

  server.post("/api/webhooks", async (request, reply) => {
    const session = await requireSession(request, reply);

    if (!session) {
      return;
    }

    if (!isRecord(request.body)) {
      return sendError(reply, 400, "INVALID_REQUEST_BODY", "Expected a JSON object.");
    }

    const webhookRegistrationId = readWebhookRegistrationId(request.body);

    if (!webhookRegistrationId) {
      return sendError(
        reply,
        400,
        "WEBHOOK_REGISTRATION_ID_REQUIRED",
        "webhookRegistrationId is required.",
      );
    }

    const parentEvent = findWebhookEventForUser(webhookRegistrationId, session.user.id);

    if (!parentEvent) {
      return sendError(reply, 400, "WEBHOOK_EVENT_NOT_FOUND", "Webhook event not found.");
    }

    const url = readHttpUrl(request.body);

    if (!url) {
      return sendError(reply, 400, "INVALID_WEBHOOK_URL", "A valid http or https URL is required.");
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

    if (isActive && parentEvent.is_active === 0) {
      return sendError(
        reply,
        400,
        "WEBHOOK_EVENT_INACTIVE",
        "Webhook registrations cannot be active for inactive events.",
      );
    }

    const timestamp = nowIso();
    const id = randomUUID();

    database
      .prepare<
        {
          createdAt: string;
          description: string | null;
          id: string;
          isActive: 0 | 1;
          updatedAt: string;
          url: string;
          userId: string;
          webhookRegistrationId: string;
        }
      >(
        `
          INSERT INTO webhook_registrations (
            id,
            webhook_registration_id,
            user_id,
            url,
            description,
            is_active,
            created_at,
            updated_at
          )
          VALUES (
            @id,
            @webhookRegistrationId,
            @userId,
            @url,
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
        isActive: toSqlBoolean(isActive),
        updatedAt: timestamp,
        url,
        userId: session.user.id,
        webhookRegistrationId,
      });

    const row = findWebhookRegistrationForUser(id, session.user.id);

    if (!row) {
      return sendError(reply, 500, "WEBHOOK_CREATE_FAILED", "Webhook registration was not created.");
    }

    return reply.status(201).send({ webhook: mapWebhookRegistration(row) });
  });

  server.get<{ Querystring: WebhookListQuery }>("/api/webhooks", async (request, reply) => {
    const session = await requireSession(request, reply);

    if (!session) {
      return;
    }

    const webhookRegistrationId =
      typeof request.query.webhookRegistrationId === "string"
        ? request.query.webhookRegistrationId.trim()
        : undefined;

    const rows = webhookRegistrationId
      ? database
          .prepare<
            { userId: string; webhookRegistrationId: string },
            WebhookRegistrationRow
          >(
            `
              SELECT *
              FROM webhook_registrations
              WHERE user_id = @userId
                AND webhook_registration_id = @webhookRegistrationId
              ORDER BY created_at DESC
            `,
          )
          .all({ userId: session.user.id, webhookRegistrationId })
      : database
          .prepare<{ userId: string }, WebhookRegistrationRow>(
            `
              SELECT *
              FROM webhook_registrations
              WHERE user_id = @userId
              ORDER BY created_at DESC
            `,
          )
          .all({ userId: session.user.id });

    return { webhooks: rows.map(mapWebhookRegistration) };
  });

  server.get<{ Params: IdParams }>("/api/webhooks/:id", async (request, reply) => {
    const session = await requireSession(request, reply);

    if (!session) {
      return;
    }

    const row = findWebhookRegistrationForUser(request.params.id, session.user.id);

    if (!row) {
      return sendError(reply, 404, "WEBHOOK_NOT_FOUND", "Webhook registration not found.");
    }

    return { webhook: mapWebhookRegistration(row) };
  });

  server.patch<{ Params: IdParams }>("/api/webhooks/:id", async (request, reply) => {
    const session = await requireSession(request, reply);

    if (!session) {
      return;
    }

    if (!isRecord(request.body)) {
      return sendError(reply, 400, "INVALID_REQUEST_BODY", "Expected a JSON object.");
    }

    const current = findWebhookRegistrationForUser(request.params.id, session.user.id);

    if (!current) {
      return sendError(reply, 404, "WEBHOOK_NOT_FOUND", "Webhook registration not found.");
    }

    const hasUrl = "url" in request.body;
    const hasDescription = "description" in request.body;
    const hasIsActive = "isActive" in request.body;

    if (!hasUrl && !hasDescription && !hasIsActive) {
      return sendError(reply, 400, "NO_FIELDS_TO_UPDATE", "No mutable fields were provided.");
    }

    const url = hasUrl ? readHttpUrl(request.body) : current.url;

    if (!url) {
      return sendError(reply, 400, "INVALID_WEBHOOK_URL", "A valid http or https URL is required.");
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
      const parentEvent = findWebhookEventForUser(
        current.webhook_registration_id,
        session.user.id,
      );

      if (!parentEvent || parentEvent.is_active === 0) {
        return sendError(
          reply,
          400,
          "WEBHOOK_EVENT_INACTIVE",
          "Webhook registrations cannot be active for inactive events.",
        );
      }
    }

    database
      .prepare<
        {
          description: string | null;
          id: string;
          isActive: 0 | 1;
          updatedAt: string;
          url: string;
          userId: string;
        }
      >(
        `
          UPDATE webhook_registrations
          SET url = @url,
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
        updatedAt: nowIso(),
        url,
        userId: session.user.id,
      });

    const row = findWebhookRegistrationForUser(request.params.id, session.user.id);

    if (!row) {
      return sendError(reply, 404, "WEBHOOK_NOT_FOUND", "Webhook registration not found.");
    }

    return { webhook: mapWebhookRegistration(row) };
  });

  server.post(
    "/api/events",
    { bodyLimit: EVENT_BODY_LIMIT_BYTES },
    async (request, reply) => {
      if (!isAllowedEventRequest()) {
        return sendError(
          reply,
          429,
          "EVENT_RATE_LIMITED",
          "Event ingestion is limited to 100 requests per second.",
        );
      }

      if (!isRecord(request.body)) {
        return sendError(reply, 400, "INVALID_REQUEST_BODY", "Expected a JSON object.");
      }

      const webhookRegistrationId = readWebhookRegistrationId(request.body);

      if (!webhookRegistrationId) {
        return sendError(
          reply,
          400,
          "WEBHOOK_REGISTRATION_ID_REQUIRED",
          "webhookRegistrationId is required.",
        );
      }

      const payload = request.body.payload;

      if (!isRecord(payload) || Object.keys(payload).length === 0) {
        return sendError(
          reply,
          400,
          "INVALID_EVENT_PAYLOAD",
          "payload must be a non-empty JSON object.",
        );
      }

      const parentEvent = findWebhookEvent(webhookRegistrationId);

      if (!parentEvent || parentEvent.is_active === 0) {
        return sendError(
          reply,
          400,
          "WEBHOOK_EVENT_INACTIVE",
          "Webhook event is unknown or inactive.",
        );
      }

      const id = randomUUID();
      const receivedAt = nowIso();

      database
        .prepare<
          {
            headers: string;
            id: string;
            payload: string;
            receivedAt: string;
            status: string;
            userId: string;
            webhookRegistrationId: string;
          }
        >(
          `
            INSERT INTO webhook_event_occurrences (
              id,
              webhook_registration_id,
              user_id,
              payload,
              headers,
              received_at,
              status
            )
            VALUES (
              @id,
              @webhookRegistrationId,
              @userId,
              @payload,
              @headers,
              @receivedAt,
              @status
            )
          `,
        )
        .run({
          headers: JSON.stringify(getUsefulHeaders(request)),
          id,
          payload: JSON.stringify(payload),
          receivedAt,
          status: RECEIVED_STATUS,
          userId: parentEvent.user_id,
          webhookRegistrationId,
        });

      return reply.status(201).send({
        event: {
          id,
          status: RECEIVED_STATUS,
          webhookRegistrationId,
        },
      });
    },
  );

  server.get<{ Querystring: WebhookListQuery }>("/api/events", async (request, reply) => {
    const session = await requireSession(request, reply);

    if (!session) {
      return;
    }

    const webhookRegistrationId =
      typeof request.query.webhookRegistrationId === "string"
        ? request.query.webhookRegistrationId.trim()
        : undefined;

    const rows = webhookRegistrationId
      ? database
          .prepare<
            { userId: string; webhookRegistrationId: string },
            EventOccurrenceRow
          >(
            `
              SELECT *
              FROM webhook_event_occurrences
              WHERE user_id = @userId
                AND webhook_registration_id = @webhookRegistrationId
              ORDER BY received_at DESC
              LIMIT 100
            `,
          )
          .all({ userId: session.user.id, webhookRegistrationId })
      : database
          .prepare<{ userId: string }, EventOccurrenceRow>(
            `
              SELECT *
              FROM webhook_event_occurrences
              WHERE user_id = @userId
              ORDER BY received_at DESC
              LIMIT 100
            `,
          )
          .all({ userId: session.user.id });

    return { events: rows.map(mapEventOccurrence) };
  });

  server.get<{ Params: IdParams }>("/api/events/:id", async (request, reply) => {
    const session = await requireSession(request, reply);

    if (!session) {
      return;
    }

    const row = database
      .prepare<{ id: string; userId: string }, EventOccurrenceRow>(
        `
          SELECT *
          FROM webhook_event_occurrences
          WHERE id = @id
            AND user_id = @userId
        `,
      )
      .get({ id: request.params.id, userId: session.user.id });

    if (!row) {
      return sendError(reply, 404, "EVENT_NOT_FOUND", "Event occurrence not found.");
    }

    return { event: mapEventOccurrence(row) };
  });
};
