import { setTimeout as sleep } from "node:timers/promises";
import {
  getIntegerOption,
  getOptionalStringOption,
  getStringOption,
  hasFlag,
} from "./args.js";
import { BackendApi } from "./backend-api.js";
import {
  startReceiverProcess,
  type StartedReceiver,
} from "./processes.js";
import { sendHarnessEvents } from "./sender.js";
import type {
  ReceiverEvent,
  ReceiverSpec,
  WebhookDelivery,
  WebhookDeliveryAttempt,
  WebhookSubscription,
} from "./types.js";

type SubscriptionLabel = {
  label: string;
  subscription: WebhookSubscription;
};

type AttemptExpectation = {
  attemptStatus: string;
  deliveryStatus: string;
  errorIncludes?: string;
  errorRequired?: boolean;
  responseStatus: number | null;
};

const expectationsByLabel = new Map<string, AttemptExpectation>([
  [
    "success",
    {
      attemptStatus: "succeeded",
      deliveryStatus: "succeeded",
      responseStatus: 200,
    },
  ],
  [
    "failure",
    {
      attemptStatus: "failed",
      deliveryStatus: "failed",
      responseStatus: 500,
    },
  ],
  [
    "slow",
    {
      attemptStatus: "failed",
      deliveryStatus: "failed",
      errorIncludes: "timed out",
      responseStatus: null,
    },
  ],
  [
    "dead",
    {
      attemptStatus: "failed",
      deliveryStatus: "failed",
      errorRequired: true,
      responseStatus: null,
    },
  ],
]);

const receiverSpecsFromArgs = (args: string[]): ReceiverSpec[] => {
  const successPort = getIntegerOption(args, "success-port", 9001);
  const failurePort = getIntegerOption(args, "failure-port", 9002);
  const slowPort = getIntegerOption(args, "slow-port", 9003);
  const specs: ReceiverSpec[] = [
    {
      label: "success",
      mode: "success",
      path: "/webhooks/success",
      port: successPort,
    },
  ];

  if (!hasFlag(args, "no-failure")) {
    specs.push({
      label: "failure",
      mode: "failure",
      path: "/webhooks/failure",
      port: failurePort,
    });
  }

  if (!hasFlag(args, "no-slow")) {
    specs.push({
      label: "slow",
      mode: "slow",
      path: "/webhooks/slow",
      port: slowPort,
    });
  }

  return specs;
};

const logReceiverEvent = (event: ReceiverEvent): void => {
  if (event.type === "ready") {
    console.log(`[receiver:${event.mode}] ready ${event.targetUrl}`);
    return;
  }

  if (event.type === "request") {
    const deliveryId = event.headers["x-webhook-delivery-id"] ?? "unknown";
    const inboundEventId = event.headers["x-inbound-event-id"] ?? "unknown";
    console.log(
      `[receiver:${event.mode}] got ${event.method} ${event.path} inbound=${inboundEventId} delivery=${deliveryId}`,
    );
    return;
  }

  if (event.type === "response") {
    if (!event.responseWritten && event.clientClosedBeforeResponse) {
      console.log(
        `[receiver:${event.mode}] client closed before late ${event.responseStatus} response`,
      );
      return;
    }

    console.log(`[receiver:${event.mode}] responded ${event.responseStatus}`);
    return;
  }

  console.error(`[receiver:error] ${event.error}`);
};

const validateAttempt = ({
  attempt,
  delivery,
  label,
}: {
  attempt: WebhookDeliveryAttempt | null;
  delivery: WebhookDelivery;
  label: string;
}): string[] => {
  const expectation = expectationsByLabel.get(label);

  if (!expectation) {
    return [];
  }

  const failures: string[] = [];

  if (delivery.status !== expectation.deliveryStatus) {
    failures.push(
      `expected deliveryStatus=${expectation.deliveryStatus}, got ${delivery.status}`,
    );
  }

  if (!attempt) {
    failures.push("expected one delivery attempt, got none");
    return failures;
  }

  if (attempt.status !== expectation.attemptStatus) {
    failures.push(
      `expected attemptStatus=${expectation.attemptStatus}, got ${attempt.status}`,
    );
  }

  if (attempt.responseStatus !== expectation.responseStatus) {
    failures.push(
      `expected response=${expectation.responseStatus ?? "none"}, got ${attempt.responseStatus ?? "none"}`,
    );
  }

  if (
    expectation.errorIncludes &&
    !attempt.errorMessage?.toLowerCase().includes(expectation.errorIncludes)
  ) {
    failures.push(
      `expected error to include "${expectation.errorIncludes}", got ${attempt.errorMessage ?? "none"}`,
    );
  }

  if (expectation.errorRequired && !attempt.errorMessage) {
    failures.push("expected an error message, got none");
  }

  return failures;
};

const printAttemptSummary = ({
  attempt,
  delivery,
  failures,
  label,
}: {
  attempt: WebhookDeliveryAttempt | null;
  delivery: WebhookDelivery;
  failures: string[];
  label: string;
}): void => {
  const result = failures.length === 0 ? "ok" : "mismatch";

  if (!attempt) {
    console.log(
      `  - ${label}: ${result} delivery=${delivery.id} deliveryStatus=${delivery.status} no attempts recorded`,
    );
    failures.forEach((failure) => console.log(`    expected: ${failure}`));
    return;
  }

  console.log(
    [
      `  - ${label}:`,
      result,
      `delivery=${delivery.id}`,
      `deliveryStatus=${delivery.status}`,
      `attempt=${attempt.attemptNumber}`,
      `attemptStatus=${attempt.status}`,
      `response=${attempt.responseStatus ?? "none"}`,
      `error=${attempt.errorMessage ?? "none"}`,
      `target=${attempt.targetUrl}`,
    ].join(" "),
  );
  failures.forEach((failure) => console.log(`    expected: ${failure}`));
};

const inspectEvent = async ({
  api,
  inboundEventId,
  labelsBySubscriptionId,
}: {
  api: BackendApi;
  inboundEventId: string;
  labelsBySubscriptionId: Map<string, string>;
}): Promise<number> => {
  const deliveries = await api.listWebhookDeliveries(inboundEventId);
  const expectedDeliveryCount = labelsBySubscriptionId.size;
  let failureCount = 0;

  console.log(`\n[inspect] inbound=${inboundEventId} deliveries=${deliveries.length}`);

  if (deliveries.length !== expectedDeliveryCount) {
    failureCount += 1;
    console.log(
      `  - delivery-count: mismatch expected=${expectedDeliveryCount} actual=${deliveries.length}`,
    );
  }

  for (const delivery of deliveries) {
    const attempts = await api.listWebhookDeliveryAttempts(delivery.id);
    const latestAttempt = attempts.at(-1) ?? null;
    const label =
      labelsBySubscriptionId.get(delivery.webhookSubscriptionId) ??
      delivery.webhookSubscriptionId;
    const failures = validateAttempt({
      attempt: latestAttempt,
      delivery,
      label,
    });

    failureCount += failures.length;

    printAttemptSummary({
      attempt: latestAttempt,
      delivery,
      failures,
      label,
    });
  }

  if (failureCount === 0) {
    console.log(`[assert] inbound=${inboundEventId} matched expected delivery outcomes`);
  }

  return failureCount;
};

export const runReceiversCommand = async (args: string[]): Promise<void> => {
  if (hasFlag(args, "help")) {
    console.log(`Usage: npm run dev:harness -- receivers

Starts independent receiver child processes and keeps them running until Ctrl+C.

Options:
  --success-port <port>  Defaults to 9001.
  --failure-port <port>  Defaults to 9002.
  --slow-port <port>     Defaults to 9003.
  --no-failure           Skip the failure receiver.
  --no-slow              Skip the slow receiver.
`);
    return;
  }

  const started: StartedReceiver[] = [];

  try {
    for (const spec of receiverSpecsFromArgs(args)) {
      started.push(
        await startReceiverProcess({
          ...spec,
          onEvent: logReceiverEvent,
        }),
      );
    }

    console.log("\n[receivers] running. Press Ctrl+C to stop.");

    await new Promise<void>((resolve) => {
      process.once("SIGINT", resolve);
      process.once("SIGTERM", resolve);
    });
  } finally {
    await Promise.all(started.map((receiver) => receiver.stop()));
  }
};

export const runBasicScenario = async (args: string[]): Promise<void> => {
  if (hasFlag(args, "help")) {
    console.log(`Usage: npm run dev:harness -- scenario basic

Runs a full local webhook flow:
  1. Starts success/failure/slow receivers as child processes.
  2. Creates a harness auth session.
  3. Creates one ingest endpoint and subscriptions.
  4. Sends public events.
  5. Inspects delivery attempts.

Options:
  --backend-url <url>      Defaults to WEBHOOK_HARNESS_BACKEND_URL or http://localhost:4000.
  --auth-origin <origin>   Origin header for Better Auth. Defaults to http://localhost:3000.
  --count <count>          Number of events to send. Defaults to 1.
  --interval-ms <ms>       Delay between events. Defaults to 0.
  --event-type <type>      Event type. Defaults to checkout.completed.
  --email <email>          Existing or new Better Auth email.
  --password <password>    Better Auth password.
  --deactivate             Deactivate the created ingest endpoint after inspection.
  --no-dead                Skip the connection-refused subscription on port 9004.
  --no-failure             Skip the failure receiver.
  --no-slow                Skip the slow receiver.
`);
    return;
  }

  const backendUrl = getStringOption(
    args,
    "backend-url",
    process.env.WEBHOOK_HARNESS_BACKEND_URL ?? "http://localhost:4000",
  );
  const authOrigin = getStringOption(
    args,
    "auth-origin",
    process.env.WEBHOOK_HARNESS_AUTH_ORIGIN ?? "http://localhost:3000",
  );
  const runId = getStringOption(args, "run-id", String(Date.now()));
  const count = getIntegerOption(args, "count", 1);
  const intervalMs = getIntegerOption(args, "interval-ms", 0);
  const eventType = getStringOption(args, "event-type", "checkout.completed");
  const email = getOptionalStringOption(args, "email");
  const password = getOptionalStringOption(args, "password");
  const includeDead = !hasFlag(args, "no-dead");
  const shouldDeactivate = hasFlag(args, "deactivate");
  const deadPort = getIntegerOption(args, "dead-port", 9004);
  const api = new BackendApi(backendUrl, authOrigin);
  const startedReceivers: StartedReceiver[] = [];
  const labelsBySubscriptionId = new Map<string, string>();
  let createdIngestEndpointId: string | null = null;

  try {
    console.log(`[scenario] backend=${backendUrl} authOrigin=${authOrigin}`);
    await api.health();

    for (const spec of receiverSpecsFromArgs(args)) {
      startedReceivers.push(
        await startReceiverProcess({
          ...spec,
          onEvent: logReceiverEvent,
        }),
      );
    }

    const session = await api.createHarnessSession({
      email,
      password,
      runId,
    });
    console.log(`[auth] user=${session.userId} email=${session.email}`);

    const ingestEndpoint = await api.createIngestEndpoint({
      description: "Created by the Node CLI webhook test harness.",
      name: `Node CLI harness ${runId}`,
      uniqueIdentifier: `node cli harness ${runId}`,
    });
    createdIngestEndpointId = ingestEndpoint.id;

    console.log(
      `[setup] ingestEndpoint=${ingestEndpoint.id} ingestUrl=${ingestEndpoint.publicIngestUrl}`,
    );

    const subscriptionLabels: SubscriptionLabel[] = [];

    for (const receiver of startedReceivers) {
      const subscription = await api.createWebhookSubscription({
        description: `CLI harness ${receiver.label} receiver`,
        ingestEndpointId: ingestEndpoint.id,
        targetUrl: receiver.targetUrl,
      });
      subscriptionLabels.push({ label: receiver.label, subscription });
    }

    if (includeDead) {
      const targetUrl = `http://127.0.0.1:${deadPort}/webhooks/dead`;
      const subscription = await api.createWebhookSubscription({
        description: "CLI harness connection-refused receiver",
        ingestEndpointId: ingestEndpoint.id,
        targetUrl,
      });
      subscriptionLabels.push({ label: "dead", subscription });
      console.log(`[receiver:dead] no process listening at ${targetUrl}`);
    }

    for (const entry of subscriptionLabels) {
      labelsBySubscriptionId.set(entry.subscription.id, entry.label);
      console.log(
        `[setup] subscription=${entry.subscription.id} label=${entry.label} target=${entry.subscription.targetUrl}`,
      );
    }

    const inboundEventIds = await sendHarnessEvents({
      correlationPrefix: `harness-${runId}`,
      count,
      eventType,
      ingestUrl: ingestEndpoint.publicIngestUrl,
      intervalMs,
      runId,
    });

    await sleep(250);

    let assertionFailures = 0;

    for (const inboundEventId of inboundEventIds) {
      assertionFailures += await inspectEvent({
        api,
        inboundEventId,
        labelsBySubscriptionId,
      });
    }

    if (assertionFailures > 0) {
      throw new Error(
        `Harness observed ${assertionFailures} delivery expectation mismatch${assertionFailures === 1 ? "" : "es"}.`,
      );
    }

    if (shouldDeactivate && createdIngestEndpointId) {
      await api.deactivateIngestEndpoint(createdIngestEndpointId);
      console.log(`[cleanup] deactivated ingestEndpoint=${createdIngestEndpointId}`);
    }
  } finally {
    await Promise.all(startedReceivers.map((receiver) => receiver.stop()));
  }
};
