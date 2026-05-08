# Webhook Test Harness

Use the `test-harness` workspace as the main local test surface for webhook
flows. It runs real localhost HTTP receivers as independent child processes,
sends public events, and inspects what the backend recorded.

The manual `curl` and `nc` examples at the end of this file are intentionally
small. They are here to show the underlying HTTP shape, not to be the preferred
day-to-day testing workflow.

## Primary Workflow

Start the backend:

```sh
npm run dev:backend
```

Run the full harness scenario:

```sh
npm run dev:harness -- scenario basic
```

The scenario:

- starts success, failure, and slow webhook receivers as separate child
  processes
- creates a local Better Auth harness session
- creates one ingest endpoint
- creates subscriptions for the receiver processes
- adds a connection-refused subscription on port `9004`
- sends a public event to the ingest URL
- prints the backend delivery attempt results
- asserts that delivery outcomes match the expected success, failure, timeout,
  and connection-refused behavior

Typical output should show:

- `success`: delivery succeeds with HTTP `200`
- `failure`: delivery fails with HTTP `500`
- `slow`: delivery fails with `Delivery request timed out.`
- `dead`: delivery fails because no process is listening
- `[assert]`: the backend records matched the harness expectations

## Useful Scenario Variations

Send more events:

```sh
npm run dev:harness -- scenario basic --count 3 --interval-ms 250
```

Skip some failure modes:

```sh
npm run dev:harness -- scenario basic --no-slow --no-dead
```

Point at a non-default backend:

```sh
npm run dev:harness -- scenario basic --backend-url http://localhost:4000
```

Use an explicit Better Auth origin header:

```sh
npm run dev:harness -- scenario basic --auth-origin http://localhost:3000
```

## Run Pieces Separately

Start receiver processes and keep them running:

```sh
npm run dev:harness -- receivers
```

Start one receiver:

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

See [`test-harness/README.md`](../test-harness/README.md) for the CLI command
reference.

## Manual HTTP Examples

These examples are useful when you want to see the wire-level shape directly.
They are not meant to replace the Node CLI harness.

### Netcat Receiver Shape

This mimics what the harness success receiver does: listen on a port, print the
incoming webhook POST, and respond with `200`.

```sh
while true; do
  body='{"received":true}'
  {
    printf 'HTTP/1.1 200 OK\r\n'
    printf 'Content-Type: application/json\r\n'
    printf 'Content-Length: %s\r\n' "${#body}"
    printf 'Connection: close\r\n'
    printf '\r\n'
    printf '%s' "$body"
  } | nc -l 127.0.0.1 9001
done
```

On some Linux netcat variants, use `nc -l -p 9001`.

### Curl Sender Shape

This mimics what the harness event sender does: POST a JSON event to the public
ingest URL with an optional correlation header.

```sh
curl -i \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: manual-example-001" \
  -d '{
    "eventType":"checkout.completed",
    "eventId":"evt_manual_001",
    "orderId":"ord_manual_001",
    "total":42.50,
    "currency":"USD"
  }' \
  "http://localhost:4000/ingest/replace-with-user-id/replace-with-slug/events"
```

The backend should create an inbound event, create one delivery for each active
subscription, POST the same JSON payload to each subscription target, and record
one delivery attempt per target.
