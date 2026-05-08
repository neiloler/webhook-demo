import { setTimeout as sleep } from "node:timers/promises";
import {
  getIntegerOption,
  getStringOption,
  hasFlag,
} from "./args.js";
import { sendPublicEvent } from "./backend-api.js";

export const buildEventPayload = ({
  eventType,
  index,
  runId,
}: {
  eventType: string;
  index: number;
  runId: string;
}): Record<string, unknown> => {
  return {
    currency: "USD",
    eventId: `evt_${runId}_${index}`,
    eventType,
    index,
    orderId: `ord_${runId}_${index}`,
    total: Number((42.5 + index).toFixed(2)),
  };
};

export const sendHarnessEvents = async ({
  correlationPrefix,
  count,
  eventType,
  ingestUrl,
  intervalMs,
  runId,
}: {
  correlationPrefix: string;
  count: number;
  eventType: string;
  ingestUrl: string;
  intervalMs: number;
  runId: string;
}): Promise<string[]> => {
  const inboundEventIds: string[] = [];

  for (let index = 1; index <= count; index += 1) {
    const payload = buildEventPayload({ eventType, index, runId });
    const correlationId = `${correlationPrefix}-${index}`;
    const event = await sendPublicEvent({
      correlationId,
      ingestUrl,
      payload,
    });

    inboundEventIds.push(event.id);
    console.log(
      `[sender] sent ${eventType} index=${index} inbound=${event.id} deliveries=${event.deliveryCount} attempted=${event.attemptedDeliveryCount}`,
    );

    if (index < count && intervalMs > 0) {
      await sleep(intervalMs);
    }
  }

  return inboundEventIds;
};

export const runSenderCommand = async (args: string[]): Promise<void> => {
  if (hasFlag(args, "help")) {
    console.log(`Usage: npm run dev:harness -- send --url <ingest-url>

Options:
  --url <url>                 Public ingest URL. Can also use INGEST_URL.
  --count <count>             Number of events to send. Defaults to 1.
  --interval-ms <ms>          Delay between events. Defaults to 0.
  --event-type <type>         Event type. Defaults to checkout.completed.
  --correlation-prefix <id>   Correlation header prefix. Defaults to harness.
  --run-id <id>               Stable run id for payload ids. Defaults to timestamp.
`);
    return;
  }

  const ingestUrl = getStringOption(args, "url", process.env.INGEST_URL ?? "");

  if (!ingestUrl) {
    throw new Error("Provide --url or INGEST_URL.");
  }

  const runId = getStringOption(args, "run-id", String(Date.now()));
  const count = getIntegerOption(args, "count", 1);
  const intervalMs = getIntegerOption(args, "interval-ms", 0);
  const eventType = getStringOption(args, "event-type", "checkout.completed");
  const correlationPrefix = getStringOption(args, "correlation-prefix", `harness-${runId}`);

  await sendHarnessEvents({
    correlationPrefix,
    count,
    eventType,
    ingestUrl,
    intervalMs,
    runId,
  });
};
