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
- `POST /api/webhook-events` creates a registered webhook event for the signed-in user.
- `GET /api/webhook-events` lists registered webhook events for the signed-in user.
- `GET /api/webhook-events/:webhookRegistrationId` returns one registered webhook event.
- `PATCH /api/webhook-events/:webhookRegistrationId` updates `name`, `description`, or `isActive`.
- `POST /api/webhooks` creates a target URL registration for a registered webhook event.
- `GET /api/webhooks` lists target URL registrations for the signed-in user.
- `GET /api/webhooks/:id` returns one target URL registration.
- `PATCH /api/webhooks/:id` updates `url`, `description`, or `isActive`.
- `POST /api/events` records a fired event occurrence for an active `webhookRegistrationId`.
- `GET /api/events` lists recent event occurrences for the signed-in user.
- `GET /api/events/:id` returns one event occurrence.

Unauthenticated requests to `GET /api/me` return `401`.

The webhook management and inspection endpoints require a Better Auth session.
Event ingestion at `POST /api/events` is intentionally unauthenticated for this
epic, but it rejects unknown or inactive `webhookRegistrationId` values, limits
payload bodies to 64 KB, and rate-limits ingestion to 100 requests per second.

## Webhook Examples

These examples assume you have already signed in and stored Better Auth cookies
in `cookies.txt`.

Create a registered webhook event:

```sh
curl -i -b cookies.txt -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"name":"Order created","description":"Fires when an order is created"}' \
  http://localhost:4000/api/webhook-events
```

Create a target URL registration:

```sh
curl -i -b cookies.txt -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "webhookRegistrationId":"replace-with-generated-id",
    "url":"https://example.com/webhooks/orders",
    "description":"Order processor"
  }' \
  http://localhost:4000/api/webhooks
```

Fire an event occurrence:

```sh
curl -i \
  -H "Content-Type: application/json" \
  -d '{
    "webhookRegistrationId":"replace-with-generated-id",
    "payload":{"orderId":"ord_123","total":42.5}
  }' \
  http://localhost:4000/api/events
```

List stored event occurrences:

```sh
curl -i -b cookies.txt \
  "http://localhost:4000/api/events?webhookRegistrationId=replace-with-generated-id"
```
