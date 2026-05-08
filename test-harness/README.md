# Test Harness

Node CLI tools for exercising the webhook demo without a browser UI.

The harness can run independent receiver processes, send public inbound events,
create backend test data, and inspect recorded delivery attempts.

This workspace is the primary local test tool. The manual `curl` and `nc`
examples in [`docs/webhook-test-harness.md`](../docs/webhook-test-harness.md)
are just protocol sketches for what the CLI is automating.

Start the backend first:

```sh
npm run dev:backend
```

Run the full local scenario:

```sh
npm run dev:harness -- scenario basic
```

That command:

- starts success, failure, and slow webhook receivers as child processes
- creates a local Better Auth harness user/session
- creates an ingest endpoint and subscriptions
- adds a connection-refused subscription on port `9004`
- sends one public event to the ingest endpoint
- prints delivery attempt results from the backend
- exits non-zero if the recorded delivery results do not match expectations

Useful options:

```sh
npm run dev:harness -- scenario basic --count 3 --interval-ms 250
npm run dev:harness -- scenario basic --no-slow --no-dead
npm run dev:harness -- scenario basic --backend-url http://localhost:4000
npm run dev:harness -- scenario basic --auth-origin http://localhost:3000
```

You can also run pieces separately.

Start receiver child processes and keep them open:

```sh
npm run dev:harness -- receivers
```

Start a single receiver:

```sh
npm run dev:harness -- receiver --port 9001 --mode success
npm run dev:harness -- receiver --port 9002 --mode failure
npm run dev:harness -- receiver --port 9003 --mode slow
```

Send events to an existing public ingest URL:

```sh
npm run dev:harness -- send \
  --url http://localhost:4000/ingest/replace-with-user-id/replace-with-slug/events \
  --count 5 \
  --interval-ms 250
```

Build and typecheck:

```sh
npm run typecheck:harness
npm run build:harness
```
