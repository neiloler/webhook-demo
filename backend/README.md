# Backend

Fastify backend service for the webhook demo.

## Local Setup

```sh
npm install
cp backend/.env.example backend/.env
npm run auth:migrate
npm run dev:backend
```

The backend runs on `http://localhost:4000` by default.

## Useful Endpoints

- `GET /health` checks that the Fastify service is running.
- `GET /api/auth/*` and `POST /api/auth/*` are owned by Better Auth.
- `GET /api/me` is protected and returns the current Better Auth session.
- `POST /api/ingest-endpoints` creates a public ingest endpoint for the signed-in user.
- `GET /api/ingest-endpoints` lists ingest endpoints for the signed-in user.
- `GET /api/ingest-endpoints/:id` returns one ingest endpoint.
- `PATCH /api/ingest-endpoints/:id` updates `name`, `description`, or `isActive`.
- `POST /api/ingest-endpoints/:id/subscriptions` creates a webhook subscription.
- `GET /api/ingest-endpoints/:id/subscriptions` lists subscriptions for one ingest endpoint.
- `GET /api/webhook-subscriptions` lists webhook subscriptions for the signed-in user.
- `GET /api/webhook-subscriptions/:id` returns one webhook subscription.
- `PATCH /api/webhook-subscriptions/:id` updates `targetUrl`, `description`, or `isActive`.
- `POST /ingest/:userId/:uniqueIdentifier/events` accepts public inbound events.
- `GET /api/inbound-events` lists recent inbound events for the signed-in user.
- `GET /api/inbound-events/:id` returns one inbound event.
- `GET /api/webhook-deliveries` lists webhook deliveries for the signed-in user.
- `GET /api/webhook-deliveries/:id` returns one webhook delivery.
- `GET /api/webhook-deliveries/:id/attempts` lists attempts for one delivery.

Unauthenticated requests to `GET /api/me` return `401`.

The ingest endpoint, subscription, and inspection endpoints require a Better
Auth session. Public ingestion at `POST /ingest/:userId/:uniqueIdentifier/events`
is intentionally unauthenticated for this epic, but it rejects unknown or
inactive endpoints, limits payload bodies to 64 KB, and rate-limits ingestion to
100 requests per second.

Epic 5 creates new webhook-domain tables. If old local Epic 3 webhook data is
disposable, delete the local SQLite file configured by `DATABASE_PATH` and run
the backend again to start from a fresh schema.

## Webhook Examples

These examples assume you have already signed in and stored Better Auth cookies
in `cookies.txt`.

Create an ingest endpoint:

```sh
curl -i -b cookies.txt -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Fast checkout flow",
    "uniqueIdentifier":"fast checkout flow 1",
    "description":"Receives checkout events"
  }' \
  http://localhost:4000/api/ingest-endpoints
```

The response includes `publicIngestUrl`, shaped like
`http://localhost:4000/ingest/:userId/fast-checkout-flow-1/events`.

Create a webhook subscription:

```sh
curl -i -b cookies.txt -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "targetUrl":"https://example.com/webhooks/orders",
    "description":"Order processor"
  }' \
  http://localhost:4000/api/ingest-endpoints/replace-with-ingest-endpoint-id/subscriptions
```

Send a public inbound event:

```sh
curl -i \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ord_123","total":42.5}' \
  http://localhost:4000/ingest/replace-with-user-id/fast-checkout-flow-1/events
```

List stored inbound events:

```sh
curl -i -b cookies.txt \
  "http://localhost:4000/api/inbound-events?ingestEndpointId=replace-with-ingest-endpoint-id"
```

List deliveries and inspect attempts:

```sh
curl -i -b cookies.txt \
  "http://localhost:4000/api/webhook-deliveries?inboundEventId=replace-with-inbound-event-id"

curl -i -b cookies.txt \
  http://localhost:4000/api/webhook-deliveries/replace-with-delivery-id/attempts
```
