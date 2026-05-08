export const RECEIVER_MODES = ["success", "failure", "slow"] as const;

export type ReceiverMode = (typeof RECEIVER_MODES)[number];

export type ReceiverSpec = {
  label: string;
  mode: ReceiverMode;
  path: string;
  port: number;
};

export type ReceiverEvent =
  | {
      host: string;
      mode: ReceiverMode;
      path: string;
      port: number;
      targetUrl: string;
      type: "ready";
    }
  | {
      body: string;
      headers: Record<string, string>;
      method: string;
      mode: ReceiverMode;
      path: string;
      port: number;
      receivedAt: string;
      type: "request";
    }
  | {
      body: string;
      clientClosedBeforeResponse: boolean;
      mode: ReceiverMode;
      path: string;
      port: number;
      responseWritten: boolean;
      responseStatus: number;
      type: "response";
    }
  | {
      error: string;
      mode: ReceiverMode | null;
      port: number | null;
      type: "error";
    };

export type IngestEndpoint = {
  id: string;
  publicIngestUrl: string;
  slug: string;
  userId: string;
};

export type WebhookSubscription = {
  id: string;
  targetUrl: string;
};

export type PublicIngestEvent = {
  attemptedDeliveryCount: number;
  deliveryCount: number;
  id: string;
  status: string;
};

export type WebhookDelivery = {
  id: string;
  inboundEventId: string;
  status: string;
  webhookSubscriptionId: string;
};

export type WebhookDeliveryAttempt = {
  attemptNumber: number;
  errorMessage: string | null;
  responseStatus: number | null;
  status: string;
  targetUrl: string;
};

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const isReceiverMode = (value: string): value is ReceiverMode => {
  return RECEIVER_MODES.some((mode) => mode === value);
};
