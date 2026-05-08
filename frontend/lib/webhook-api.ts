import { backendUrl } from "@/lib/auth-client";

export type DashboardSummary = {
  activeIngestEndpoints: number;
  failedDeliveries: number;
  inboundEventsLast24Hours: number;
  pendingOrRetryableDeliveries: number;
  totalIngestEndpoints: number;
  webhookDeliveriesLast24Hours: number;
};

export type IngestEndpoint = {
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

export type WebhookSubscription = {
  id: string;
  ingestEndpointId: string;
  userId: string;
  targetUrl: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InboundEvent = {
  id: string;
  ingestEndpointId: string;
  userId: string;
  payload: unknown;
  headers: unknown;
  receivedAt: string;
  status: string;
};

export type DeliveryStatus =
  | "pending"
  | "in_progress"
  | "succeeded"
  | "failed"
  | "retrying";

export type DeliveryAttemptStatus = "pending" | "succeeded" | "failed";

export type WebhookDelivery = {
  id: string;
  inboundEventId: string;
  webhookSubscriptionId: string;
  userId: string;
  status: DeliveryStatus;
  nextAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WebhookDeliveryAttempt = {
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

export type CreateIngestEndpointInput = {
  name: string;
  uniqueIdentifier?: string;
  description?: string | null;
};

export type UpdateIngestEndpointInput = {
  name?: string;
  description?: string | null;
  isActive?: boolean;
};

export type CreateWebhookSubscriptionInput = {
  targetUrl: string;
  description?: string | null;
  isActive?: boolean;
};

export type UpdateWebhookSubscriptionInput = {
  targetUrl?: string;
  description?: string | null;
  isActive?: boolean;
};

type ApiErrorPayload = {
  code?: string;
  error?: string;
};

export class BackendApiError extends Error {
  code: string | null;
  status: number;

  constructor({
    code,
    message,
    status,
  }: {
    code: string | null;
    message: string;
    status: number;
  }) {
    super(message);
    this.code = code;
    this.name = "BackendApiError";
    this.status = status;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isApiErrorPayload = (value: unknown): value is ApiErrorPayload => {
  return isRecord(value);
};

const toApiError = (status: number, body: unknown): BackendApiError => {
  if (isApiErrorPayload(body)) {
    const code = typeof body.code === "string" ? body.code : null;
    const message =
      typeof body.error === "string" ? body.error : `Backend returned ${status}.`;

    return new BackendApiError({ code, message, status });
  }

  return new BackendApiError({
    code: null,
    message: typeof body === "string" && body ? body : `Backend returned ${status}.`,
    status,
  });
};

const requestBackend = async <ResponseBody>(
  path: string,
  init: RequestInit = {},
): Promise<ResponseBody> => {
  const headers = new Headers(init.headers);

  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${backendUrl}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? ((await response.json()) as unknown)
    : await response.text();

  if (!response.ok) {
    throw toApiError(response.status, body);
  }

  return body as ResponseBody;
};

const toJsonBody = (value: unknown): string => JSON.stringify(value);

export const getDashboardSummary = async () => {
  return requestBackend<{ summary: DashboardSummary }>("/api/dashboard/summary");
};

export const listIngestEndpoints = async () => {
  return requestBackend<{ ingestEndpoints: IngestEndpoint[] }>("/api/ingest-endpoints");
};

export const createIngestEndpoint = async (
  input: CreateIngestEndpointInput,
) => {
  return requestBackend<{ ingestEndpoint: IngestEndpoint }>("/api/ingest-endpoints", {
    body: toJsonBody(input),
    method: "POST",
  });
};

export const updateIngestEndpoint = async (
  id: string,
  input: UpdateIngestEndpointInput,
) => {
  return requestBackend<{ ingestEndpoint: IngestEndpoint }>(
    `/api/ingest-endpoints/${encodeURIComponent(id)}`,
    {
      body: toJsonBody(input),
      method: "PATCH",
    },
  );
};

export const listWebhookSubscriptions = async () => {
  return requestBackend<{ webhookSubscriptions: WebhookSubscription[] }>(
    "/api/webhook-subscriptions",
  );
};

export const createWebhookSubscription = async (
  ingestEndpointId: string,
  input: CreateWebhookSubscriptionInput,
) => {
  return requestBackend<{ webhookSubscription: WebhookSubscription }>(
    `/api/ingest-endpoints/${encodeURIComponent(ingestEndpointId)}/subscriptions`,
    {
      body: toJsonBody(input),
      method: "POST",
    },
  );
};

export const updateWebhookSubscription = async (
  id: string,
  input: UpdateWebhookSubscriptionInput,
) => {
  return requestBackend<{ webhookSubscription: WebhookSubscription }>(
    `/api/webhook-subscriptions/${encodeURIComponent(id)}`,
    {
      body: toJsonBody(input),
      method: "PATCH",
    },
  );
};

export const listInboundEvents = async () => {
  return requestBackend<{ inboundEvents: InboundEvent[] }>("/api/inbound-events");
};

export const listWebhookDeliveries = async () => {
  return requestBackend<{ webhookDeliveries: WebhookDelivery[] }>(
    "/api/webhook-deliveries",
  );
};

export const listWebhookDeliveryAttempts = async (deliveryId: string) => {
  return requestBackend<{ webhookDeliveryAttempts: WebhookDeliveryAttempt[] }>(
    `/api/webhook-deliveries/${encodeURIComponent(deliveryId)}/attempts`,
  );
};

export const retryWebhookDelivery = async (deliveryId: string) => {
  return requestBackend<{ webhookDelivery: WebhookDelivery }>(
    `/api/webhook-deliveries/${encodeURIComponent(deliveryId)}/retry`,
    {
      body: toJsonBody({}),
      method: "POST",
    },
  );
};

export const reprocessInboundEvent = async (inboundEventId: string) => {
  return requestBackend<{
    attemptedDeliveryCount: number;
    webhookDeliveries: WebhookDelivery[];
  }>(`/api/inbound-events/${encodeURIComponent(inboundEventId)}/reprocess`, {
    body: toJsonBody({}),
    method: "POST",
  });
};

export const retryWebhookSubscription = async (
  subscriptionId: string,
  inboundEventId: string,
) => {
  return requestBackend<{ webhookDelivery: WebhookDelivery }>(
    `/api/webhook-subscriptions/${encodeURIComponent(subscriptionId)}/retry`,
    {
      body: toJsonBody({ inboundEventId }),
      method: "POST",
    },
  );
};
