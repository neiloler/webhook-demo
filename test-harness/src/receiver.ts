import { createServer, type IncomingHttpHeaders } from "node:http";
import { setTimeout as sleep } from "node:timers/promises";
import {
  getIntegerOption,
  getStringOption,
  hasFlag,
} from "./args.js";
import {
  type ReceiverEvent,
  type ReceiverMode,
  isReceiverMode,
} from "./types.js";

const headersToRecord = (
  headers: IncomingHttpHeaders,
): Record<string, string> => {
  return Object.entries(headers).reduce<Record<string, string>>(
    (result, [name, value]) => {
      if (Array.isArray(value)) {
        result[name] = value.join(", ");
        return result;
      }

      if (typeof value === "string") {
        result[name] = value;
      }

      return result;
    },
    {},
  );
};

const readRequestBody = async (
  request: NodeJS.ReadableStream,
): Promise<string> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }

  return Buffer.concat(chunks).toString("utf8");
};

const responseForMode = (mode: ReceiverMode): {
  body: string;
  status: number;
} => {
  if (mode === "failure") {
    return {
      body: JSON.stringify({ error: "intentional receiver failure" }),
      status: 500,
    };
  }

  if (mode === "slow") {
    return {
      body: "",
      status: 204,
    };
  }

  return {
    body: JSON.stringify({ received: true }),
    status: 200,
  };
};

const emit = ({
  event,
  json,
}: {
  event: ReceiverEvent;
  json: boolean;
}): void => {
  if (json) {
    console.log(JSON.stringify(event));
    return;
  }

  if (event.type === "ready") {
    console.log(
      `[receiver:${event.mode}] listening on ${event.targetUrl}`,
    );
    return;
  }

  if (event.type === "request") {
    const deliveryId = event.headers["x-webhook-delivery-id"] ?? "unknown";
    const inboundEventId = event.headers["x-inbound-event-id"] ?? "unknown";
    console.log(
      `[receiver:${event.mode}] ${event.method} ${event.path} inbound=${inboundEventId} delivery=${deliveryId}`,
    );
    console.log(event.body);
    return;
  }

  if (event.type === "response") {
    if (!event.responseWritten && event.clientClosedBeforeResponse) {
      console.log(
        `[receiver:${event.mode}] client closed before late ${event.responseStatus} response on port ${event.port}`,
      );
      return;
    }

    console.log(
      `[receiver:${event.mode}] responded ${event.responseStatus} on port ${event.port}`,
    );
    return;
  }

  console.error(`[receiver:error] ${event.error}`);
};

export const runReceiverCommand = async (args: string[]): Promise<void> => {
  if (hasFlag(args, "help")) {
    console.log(`Usage: npm run dev:harness -- receiver --port 9001 --mode success

Options:
  --host <host>       Host to bind. Defaults to 127.0.0.1.
  --port <port>       Port to bind. Required for useful receiver runs.
  --path <path>       Path used in ready output. Defaults to /webhooks/<mode>.
  --mode <mode>       success, failure, or slow.
  --delay-ms <ms>     Delay before slow receiver replies. Defaults to 5000.
  --json              Emit JSON lines for orchestration.
`);
    return;
  }

  const host = getStringOption(args, "host", "127.0.0.1");
  const modeOption = getStringOption(args, "mode", "success");

  if (!isReceiverMode(modeOption)) {
    throw new Error(`Unknown receiver mode "${modeOption}".`);
  }

  const mode = modeOption;
  const port = getIntegerOption(args, "port", 9001);
  const path = getStringOption(args, "path", `/webhooks/${mode}`);
  const delayMs = getIntegerOption(args, "delay-ms", 5_000);
  const json = hasFlag(args, "json");
  const server = createServer(async (request, response) => {
    let clientClosedBeforeResponse = false;

    response.on("close", () => {
      if (!response.writableEnded) {
        clientClosedBeforeResponse = true;
      }
    });

    const body = await readRequestBody(request);
    const requestPath = request.url ?? path;
    const headers = headersToRecord(request.headers);

    emit({
      event: {
        body,
        headers,
        method: request.method ?? "UNKNOWN",
        mode,
        path: requestPath,
        port,
        receivedAt: new Date().toISOString(),
        type: "request",
      },
      json,
    });

    if (mode === "slow") {
      await sleep(delayMs);
    }

    const receiverResponse = responseForMode(mode);
    const responseWritten = !clientClosedBeforeResponse && !response.destroyed;

    if (responseWritten) {
      response.statusCode = receiverResponse.status;

      if (receiverResponse.body) {
        response.setHeader("Content-Type", "application/json");
        response.setHeader("Content-Length", Buffer.byteLength(receiverResponse.body));
      } else {
        response.setHeader("Content-Length", "0");
      }

      response.setHeader("Connection", "close");
      response.end(receiverResponse.body);
    }

    emit({
      event: {
        body: receiverResponse.body,
        clientClosedBeforeResponse,
        mode,
        path: requestPath,
        port,
        responseWritten,
        responseStatus: receiverResponse.status,
        type: "response",
      },
      json,
    });
  });

  server.on("error", (error) => {
    emit({
      event: {
        error: error instanceof Error ? error.message : "Receiver failed.",
        mode,
        port,
        type: "error",
      },
      json,
    });
    process.exitCode = 1;
  });

  await new Promise<void>((resolve) => {
    server.listen(port, host, () => {
      emit({
        event: {
          host,
          mode,
          path,
          port,
          targetUrl: `http://${host}:${port}${path}`,
          type: "ready",
        },
        json,
      });
      resolve();
    });
  });

  const close = () => {
    server.close(() => process.exit(0));
  };

  process.once("SIGINT", close);
  process.once("SIGTERM", close);
};
