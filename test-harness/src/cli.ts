import { runReceiverCommand } from "./receiver.js";
import { runSenderCommand } from "./sender.js";
import { runBasicScenario, runReceiversCommand } from "./scenarios.js";

const printHelp = (): void => {
  console.log(`Webhook Demo Test Harness

Usage:
  npm run dev:harness -- scenario basic
  npm run dev:harness -- receivers
  npm run dev:harness -- receiver --port 9001 --mode success
  npm run dev:harness -- send --url <public-ingest-url>

Commands:
  scenario basic   Run the full local sender/receiver/backend inspection flow.
  receivers        Start success/failure/slow receiver child processes.
  receiver         Start one receiver process.
  send             Send one or more public events to an ingest URL.

Run any command with --help for command-specific options.
`);
};

const main = async (): Promise<void> => {
  const [command, ...rest] = process.argv.slice(2);

  if (!command || command === "--help" || command === "help") {
    printHelp();
    return;
  }

  if (command === "receiver") {
    await runReceiverCommand(rest);
    return;
  }

  if (command === "receivers") {
    await runReceiversCommand(rest);
    return;
  }

  if (command === "send" || command === "sender") {
    await runSenderCommand(rest);
    return;
  }

  if (command === "scenario") {
    const [scenarioName = "basic", ...scenarioArgs] = rest;

    if (scenarioName !== "basic") {
      throw new Error(`Unknown scenario "${scenarioName}".`);
    }

    await runBasicScenario(scenarioArgs);
    return;
  }

  throw new Error(`Unknown command "${command}".`);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Harness failed.";
  console.error(`[harness:error] ${message}`);
  process.exitCode = 1;
});
