import {
  type IngestEndpoint,
  type PublicIngestEvent,
  type WebhookDelivery,
  type WebhookDeliveryAttempt,
  type WebhookSubscription,
  isRecord,
} from "./types.js";

type HarnessSession = {
  email: string;
  password: string;
  userId: string;
};

type JsonRequestInit = Omit<RequestInit, "body"> & {
  body?: unknown;
};

type RequestOptions = {
  auth?: boolean;
};

export class BackendApiError extends Error {
  body: unknown;
  status: number;

  constructor({
    body,
    message,
    status,
  }: {
    body: unknown;
    message: string;
    status: number;
  }) {
    super(message);
    this.body = body;
    this.name = "BackendApiError";
    this.status = status;
  }
}

class CookieJar {
  private readonly cookies = new Map<string, string>();

  addFromHeaders(headers: Headers): void {
    for (const cookieHeader of readSetCookieHeaders(headers)) {
      const [nameValue] = cookieHeader.split(";");
      const separatorIndex = nameValue.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const name = nameValue.slice(0, separatorIndex).trim();
      const value = nameValue.slice(separatorIndex + 1).trim();

      if (name && value) {
        this.cookies.set(name, value);
      }
    }
  }

  toHeader(): string {
    return [...this.cookies.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}

const readSetCookieHeaders = (headers: Headers): string[] => {
  const withGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };

  const setCookieHeaders = withGetSetCookie.getSetCookie?.();

  if (setCookieHeaders && setCookieHeaders.length > 0) {
    return setCookieHeaders;
  }

  const combined = headers.get("set-cookie");
  return combined ? splitSetCookieHeader(combined) : [];
};

const splitSetCookieHeader = (value: string): string[] => {
  const headers: string[] = [];
  let start = 0;
  let index = 0;

  while (index < value.length) {
    if (value[index] === ",") {
      let next = index + 1;

      while (value[next] === " ") {
        next += 1;
      }

      const nextEqualsIndex = value.indexOf("=", next);
      const nextSemicolonIndex = value.indexOf(";", next);
      const looksLikeCookie =
        nextEqualsIndex !== -1 &&
        (nextSemicolonIndex === -1 || nextEqualsIndex < nextSemicolonIndex);

      if (looksLikeCookie) {
        headers.push(value.slice(start, index).trim());
        start = next;
        index = next;
        continue;
      }
    }

    index += 1;
  }

  const finalHeader = value.slice(start).trim();

  if (finalHeader) {
    headers.push(finalHeader);
  }

  return headers;
};

const readResponseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return text;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const responseMessage = (status: number, body: unknown): string => {
  if (isRecord(body) && typeof body.error === "string") {
    return body.error;
  }

  if (isRecord(body) && typeof body.message === "string") {
    return body.message;
  }

  if (typeof body === "string" && body.trim().length > 0) {
    return body;
  }

  return `Backend returned ${status}.`;
};

const readRecord = (
  value: unknown,
  key: string,
): Record<string, unknown> => {
  if (!isRecord(value) || !isRecord(value[key])) {
    throw new Error(`Expected response field "${key}" to be an object.`);
  }

  return value[key];
};

const readString = (
  value: Record<string, unknown>,
  key: string,
): string => {
  const field = value[key];

  if (typeof field !== "string" || field.length === 0) {
    throw new Error(`Expected response field "${key}" to be a non-empty string.`);
  }

  return field;
};

const readNumber = (
  value: Record<string, unknown>,
  key: string,
): number => {
  const field = value[key];

  if (typeof field !== "number") {
    throw new Error(`Expected response field "${key}" to be a number.`);
  }

  return field;
};

const readNullableNumber = (
  value: Record<string, unknown>,
  key: string,
): number | null => {
  const field = value[key];

  if (field === null) {
    return null;
  }

  if (typeof field !== "number") {
    throw new Error(`Expected response field "${key}" to be a number or null.`);
  }

  return field;
};

const readNullableString = (
  value: Record<string, unknown>,
  key: string,
): string | null => {
  const field = value[key];

  if (field === null) {
    return null;
  }

  if (typeof field !== "string") {
    throw new Error(`Expected response field "${key}" to be a string or null.`);
  }

  return field;
};

const readArray = (
  value: unknown,
  key: string,
): unknown[] => {
  if (!isRecord(value) || !Array.isArray(value[key])) {
    throw new Error(`Expected response field "${key}" to be an array.`);
  }

  return value[key];
};

const toIngestEndpoint = (value: unknown): IngestEndpoint => {
  if (!isRecord(value)) {
    throw new Error("Expected ingestEndpoint to be an object.");
  }

  return {
    id: readString(value, "id"),
    publicIngestUrl: readString(value, "publicIngestUrl"),
    slug: readString(value, "slug"),
    userId: readString(value, "userId"),
  };
};

const toWebhookSubscription = (value: unknown): WebhookSubscription => {
  if (!isRecord(value)) {
    throw new Error("Expected webhookSubscription to be an object.");
  }

  return {
    id: readString(value, "id"),
    targetUrl: readString(value, "targetUrl"),
  };
};

const toWebhookDelivery = (value: unknown): WebhookDelivery => {
  if (!isRecord(value)) {
    throw new Error("Expected webhookDelivery to be an object.");
  }

  return {
    id: readString(value, "id"),
    inboundEventId: readString(value, "inboundEventId"),
    status: readString(value, "status"),
    webhookSubscriptionId: readString(value, "webhookSubscriptionId"),
  };
};

const toWebhookDeliveryAttempt = (value: unknown): WebhookDeliveryAttempt => {
  if (!isRecord(value)) {
    throw new Error("Expected webhookDeliveryAttempt to be an object.");
  }

  return {
    attemptNumber: readNumber(value, "attemptNumber"),
    errorMessage: readNullableString(value, "errorMessage"),
    responseStatus: readNullableNumber(value, "responseStatus"),
    status: readString(value, "status"),
    targetUrl: readString(value, "targetUrl"),
  };
};

const toPublicIngestEvent = (value: unknown): PublicIngestEvent => {
  if (!isRecord(value)) {
    throw new Error("Expected event to be an object.");
  }

  return {
    attemptedDeliveryCount: readNumber(value, "attemptedDeliveryCount"),
    deliveryCount: readNumber(value, "deliveryCount"),
    id: readString(value, "id"),
    status: readString(value, "status"),
  };
};

export class BackendApi {
  private readonly authOrigin: string;
  private readonly backendUrl: string;
  private readonly cookieJar = new CookieJar();

  constructor(backendUrl: string, authOrigin: string) {
    this.authOrigin = authOrigin;
    this.backendUrl = backendUrl.replace(/\/$/, "");
  }

  health = async (): Promise<void> => {
    await this.requestJson("/health");
  };

  signUpEmail = async ({
    email,
    name,
    password,
  }: {
    email: string;
    name: string;
    password: string;
  }): Promise<void> => {
    await this.requestJson("/api/auth/sign-up/email", {
      body: { email, name, password },
      method: "POST",
    });
  };

  signInEmail = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<void> => {
    await this.requestJson("/api/auth/sign-in/email", {
      body: { email, password },
      method: "POST",
    });
  };

  createHarnessSession = async ({
    email,
    password,
    runId,
  }: {
    email: string | null;
    password: string | null;
    runId: string;
  }): Promise<HarnessSession> => {
    const sessionEmail = email ?? `webhook-harness-${runId}@example.test`;
    const sessionPassword = password ?? "local-test-password-123";

    try {
      await this.signUpEmail({
        email: sessionEmail,
        name: "Webhook Harness",
        password: sessionPassword,
      });
    } catch (error) {
      if (!(error instanceof BackendApiError)) {
        throw error;
      }
    }

    await this.signInEmail({
      email: sessionEmail,
      password: sessionPassword,
    });

    const me = await this.requestJson("/api/me", {}, { auth: true });

    if (!isRecord(me)) {
      throw new Error("Expected /api/me response to be an object.");
    }

    const user = readRecord(me, "user");

    return {
      email: sessionEmail,
      password: sessionPassword,
      userId: readString(user, "id"),
    };
  };

  createIngestEndpoint = async ({
    description,
    name,
    uniqueIdentifier,
  }: {
    description: string;
    name: string;
    uniqueIdentifier: string;
  }): Promise<IngestEndpoint> => {
    const body = await this.requestJson(
      "/api/ingest-endpoints",
      {
        body: { description, name, uniqueIdentifier },
        method: "POST",
      },
      { auth: true },
    );

    if (!isRecord(body)) {
      throw new Error("Expected ingest endpoint response to be an object.");
    }

    return toIngestEndpoint(readRecord(body, "ingestEndpoint"));
  };

  deactivateIngestEndpoint = async (id: string): Promise<void> => {
    await this.requestJson(
      `/api/ingest-endpoints/${encodeURIComponent(id)}`,
      {
        body: { isActive: false },
        method: "PATCH",
      },
      { auth: true },
    );
  };

  createWebhookSubscription = async ({
    description,
    ingestEndpointId,
    targetUrl,
  }: {
    description: string;
    ingestEndpointId: string;
    targetUrl: string;
  }): Promise<WebhookSubscription> => {
    const body = await this.requestJson(
      `/api/ingest-endpoints/${encodeURIComponent(ingestEndpointId)}/subscriptions`,
      {
        body: { description, targetUrl },
        method: "POST",
      },
      { auth: true },
    );

    if (!isRecord(body)) {
      throw new Error("Expected webhook subscription response to be an object.");
    }

    return toWebhookSubscription(readRecord(body, "webhookSubscription"));
  };

  listWebhookDeliveries = async (
    inboundEventId: string,
  ): Promise<WebhookDelivery[]> => {
    const query = new URLSearchParams({ inboundEventId });
    const body = await this.requestJson(
      `/api/webhook-deliveries?${query}`,
      {},
      { auth: true },
    );

    return readArray(body, "webhookDeliveries").map(toWebhookDelivery);
  };

  listWebhookDeliveryAttempts = async (
    deliveryId: string,
  ): Promise<WebhookDeliveryAttempt[]> => {
    const body = await this.requestJson(
      `/api/webhook-deliveries/${encodeURIComponent(deliveryId)}/attempts`,
      {},
      { auth: true },
    );

    return readArray(body, "webhookDeliveryAttempts").map(toWebhookDeliveryAttempt);
  };

  retryWebhookDelivery = async (deliveryId: string): Promise<WebhookDelivery> => {
    const body = await this.requestJson(
      `/api/webhook-deliveries/${encodeURIComponent(deliveryId)}/retry`,
      {
        body: {},
        method: "POST",
      },
      { auth: true },
    );

    if (!isRecord(body)) {
      throw new Error("Expected retry response to be an object.");
    }

    return toWebhookDelivery(readRecord(body, "webhookDelivery"));
  };

  private requestJson = async (
    path: string,
    init: JsonRequestInit = {},
    options: RequestOptions = {},
  ): Promise<unknown> => {
    const headers = new Headers(init.headers);

    if (init.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (path.startsWith("/api/auth/") && !headers.has("Origin")) {
      headers.set("Origin", this.authOrigin);
    }

    if (options.auth) {
      const cookieHeader = this.cookieJar.toHeader();

      if (cookieHeader) {
        headers.set("Cookie", cookieHeader);
      }
    }

    const response = await fetch(`${this.backendUrl}${path}`, {
      ...init,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      headers,
    });

    this.cookieJar.addFromHeaders(response.headers);

    const body = await readResponseBody(response);

    if (!response.ok) {
      throw new BackendApiError({
        body,
        message: responseMessage(response.status, body),
        status: response.status,
      });
    }

    return body;
  };
}

export const sendPublicEvent = async ({
  correlationId,
  ingestUrl,
  payload,
}: {
  correlationId: string;
  ingestUrl: string;
  payload: Record<string, unknown>;
}): Promise<PublicIngestEvent> => {
  const response = await fetch(ingestUrl, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      "X-Correlation-ID": correlationId,
    },
    method: "POST",
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new BackendApiError({
      body,
      message: responseMessage(response.status, body),
      status: response.status,
    });
  }

  if (!isRecord(body)) {
    throw new Error("Expected public ingest response to be an object.");
  }

  return toPublicIngestEvent(readRecord(body, "event"));
};
