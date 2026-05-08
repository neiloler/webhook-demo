import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";
import { type ReceiverEvent, type ReceiverMode, isRecord } from "./types.js";

export type StartedReceiver = {
  child: ChildProcessWithoutNullStreams;
  label: string;
  mode: ReceiverMode;
  port: number;
  stop: () => Promise<void>;
  targetUrl: string;
};

type StartReceiverOptions = {
  label: string;
  mode: ReceiverMode;
  onEvent: (event: ReceiverEvent) => void;
  path: string;
  port: number;
};

const isReceiverEvent = (value: unknown): value is ReceiverEvent => {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }

  return ["ready", "request", "response", "error"].includes(value.type);
};

const currentCliInvocation = (): {
  args: string[];
  command: string;
} => {
  const modulePath = fileURLToPath(import.meta.url);
  const extension = extname(modulePath);
  const cliPath = join(dirname(modulePath), `cli${extension}`);

  if (extension === ".ts") {
    return {
      args: ["--import", "tsx", cliPath],
      command: process.execPath,
    };
  }

  return {
    args: [cliPath],
    command: process.execPath,
  };
};

const stopChild = async (
  child: ChildProcessWithoutNullStreams,
): Promise<void> => {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  const exited = new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
  });

  child.kill("SIGTERM");

  await Promise.race([
    exited,
    sleep(2_000).then(() => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGKILL");
      }
    }),
  ]);
};

export const startReceiverProcess = async ({
  label,
  mode,
  onEvent,
  path,
  port,
}: StartReceiverOptions): Promise<StartedReceiver> => {
  const invocation = currentCliInvocation();
  const child = spawn(invocation.command, [
    ...invocation.args,
    "receiver",
    "--mode",
    mode,
    "--port",
    String(port),
    "--path",
    path,
    "--json",
  ]);

  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => {
    for (const line of chunk.split(/\r?\n/).filter(Boolean)) {
      console.error(`[receiver:${label}:stderr] ${line}`);
    }
  });

  let stdoutBuffer = "";
  let settled = false;

  const ready = new Promise<string>((resolve, reject) => {
    const readyTimeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error(`Receiver "${label}" did not become ready.`));
      }
    }, 5_000);

    child.once("exit", (code, signal) => {
      if (!settled) {
        settled = true;
        clearTimeout(readyTimeout);
        reject(
          new Error(
            `Receiver "${label}" exited before ready. code=${code ?? "none"} signal=${signal ?? "none"}`,
          ),
        );
      }
    });

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdoutBuffer += chunk;
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        let parsed: unknown;

        try {
          parsed = JSON.parse(line) as unknown;
        } catch {
          console.log(`[receiver:${label}] ${line}`);
          continue;
        }

        if (!isReceiverEvent(parsed)) {
          continue;
        }

        onEvent(parsed);

        if (parsed.type === "error" && !settled) {
          settled = true;
          clearTimeout(readyTimeout);
          reject(new Error(parsed.error));
        }

        if (parsed.type === "ready" && !settled) {
          settled = true;
          clearTimeout(readyTimeout);
          resolve(parsed.targetUrl);
        }
      }
    });
  });

  const targetUrl = await ready;

  return {
    child,
    label,
    mode,
    port,
    stop: () => stopChild(child),
    targetUrl,
  };
};
