# Epic 5: Ingest Endpoints, Subscriptions, and Deliveries

## Goal

Revisit and reshape the backend webhook domain model around clearer concepts:

- **Ingest Endpoint**: the public URL where inbound events arrive.
- **Inbound Event**: the actual event payload received by an ingest endpoint.
- **Webhook Subscription**: a target URL that should be notified when an inbound event is accepted.
- **Webhook Delivery**: the outbound delivery work created for a subscription after an inbound event is accepted.
- **Webhook Delivery Attempt**: one concrete attempt to send a webhook delivery to its subscription target.

This epic is a deliberate departure from the earlier "Webhook Event" and "Webhook Registration" wording. The new model should make the lifecycle easier to reason about and should support future retry, logging, replay, and delivery inspection work.

## Context

The current backend model uses:

- `webhook_events`
- `webhook_registrations`
- `webhook_event_occurrences`
- `webhookRegistrationId`

That naming is becoming confusing because "webhook event" can mean either the durable thing a user registers or the actual event occurrence that came in.

Epic 5 should replace that mental model with:

- `ingest_endpoints`
- `inbound_events`
- `webhook_subscriptions`
- `webhook_deliveries`
- `webhook_delivery_attempts`

## Vocabulary

### Ingest Endpoint

An ingest endpoint is created by an authenticated admin user. It represents a public URL where events can be sent.

Example public path:

```text
/ingest/:userId/:uniqueIdentifier/events
```

Example:

```text
/ingest/user_123/fast-checkout-flow-1/events
```

The user can provide human readable text such as `fast checkout flow 1`; the backend turns it into a URL-safe slug such as `fast-checkout-flow-1`.

The path is not a secret. It identifies where events should be sent. Abuse protection and future signing/API-key work should be layered on top.

### Inbound Event

An inbound event is the actual event that arrived at an ingest endpoint.

Each inbound event should get a stable system-generated GUID so we can track the "shot" through the backend. This GUID is never reused. This is the thing we inspect when answering questions like:

- Did the backend receive the event?
- Which subscriptions did it fan out to?
- Which deliveries were created?
- Which delivery attempts succeeded or failed?

### Webhook Subscription

A webhook subscription is a target URL that belongs to an ingest endpoint.

When an inbound event arrives at the ingest endpoint, active webhook subscriptions for that endpoint are eligible to receive a webhook delivery.

This replaces the old term "Webhook Registration."

### Webhook Delivery

A webhook delivery is the outbound work item created from one inbound event to one webhook subscription.

If an ingest endpoint has three active subscriptions and receives one inbound event, the backend should create one inbound event and three webhook deliveries.

### Webhook Delivery Attempt

A delivery attempt records one attempt to send a webhook delivery to the subscription target.

One webhook delivery can have multiple delivery attempts over time if retries are added.

## Core Flow

1. An authenticated admin user creates an ingest endpoint.
2. The backend slugifies the user-provided identifier.
3. The backend stores the ingest endpoint and returns its public ingest URL.
4. The authenticated admin user creates one or more webhook subscriptions for that ingest endpoint.
5. An external producer sends a JSON event to the public ingest URL.
6. The backend validates that the ingest endpoint exists and is active.
7. The backend creates a new inbound event record with a new GUID.
8. The backend finds active webhook subscriptions for the ingest endpoint.
9. The backend creates webhook delivery records for the inbound event and active subscriptions.
10. The backend immediately attempts a simple HTTP `POST` delivery to each active subscription target.
11. The backend records one webhook delivery attempt for each attempted outbound `POST`.

## Scope

- Rename the backend domain from registered webhook events and webhook registrations to ingest endpoints and webhook subscriptions.
- Add authenticated management APIs for ingest endpoints.
- Add authenticated management APIs for webhook subscriptions.
- Add public event ingestion at `/ingest/:userId/:uniqueIdentifier/events`.
- Add inbound event persistence with one generated GUID per accepted event.
- Create webhook delivery rows when an inbound event is accepted.
- Attempt a simple outbound HTTP `POST` to each active webhook subscription target.
- Add webhook delivery attempt persistence for the first outbound `POST` attempt.
- Keep Better Auth for admin/backend management authentication.
- Keep the public ingest endpoint unauthenticated for this epic.
- Keep SQLite as the backend database.
- Keep basic rate limiting for public ingestion.

## Non-Goals

- Frontend management UI changes.
- Production-grade queue infrastructure.
- Distributed rate limiting.
- Multi-tenant organizations beyond the Better Auth user.
- API key authentication for event producers.
- Request signing for event producers.
- Full retry scheduling.
- Production-grade asynchronous delivery workers.
- Polished delivery log UI.

Epic 5 should include the simplest possible outbound delivery execution: after accepting an inbound event, synchronously attempt one HTTP `POST` to each active subscription target and record the result as a delivery attempt. More robust queueing and retry behavior should be handled later.

## Requirements

### Authentication Boundary

Better Auth session authentication is required for admin management operations:

- Creating ingest endpoints.
- Updating ingest endpoints.
- Listing ingest endpoints.
- Creating webhook subscriptions.
- Updating webhook subscriptions.
- Listing webhook subscriptions.
- Inspecting inbound events, deliveries, and attempts.

Better Auth session authentication is not required for public event ingestion:

- `POST /ingest/:userId/:uniqueIdentifier/events`

The public ingestion route should still have defensive controls:

- Rate limit to 100 requests per second.
- Modest request body size limit.
- Reject unknown endpoints.
- Reject inactive endpoints.
- Reject malformed JSON payloads.
- Return minimal response data.

### Slug Generation

When creating an ingest endpoint, the user can provide a human-readable identifier.

Example input:

```text
fast checkout flow 1
```

Generated slug:

```text
fast-checkout-flow-1
```

Slug rules:

- Lowercase the value.
- Trim leading and trailing whitespace.
- Replace spaces and non-alphanumeric separators with hyphens.
- Collapse repeated hyphens.
- Trim leading and trailing hyphens.
- Reject empty generated slugs.
- Enforce uniqueness per user.

For the first implementation, duplicate slugs for the same user should return `409 Conflict` instead of silently appending a suffix. This keeps public ingest URLs predictable.

### Public Ingest URL

Each ingest endpoint should expose a public URL shaped like:

```text
/ingest/:userId/:uniqueIdentifier/events
```

Where:

- `userId` is the Better Auth user id that owns the ingest endpoint.
- `uniqueIdentifier` is the generated slug.

For this project, use the Better Auth `userId` directly in the public ingest path. Treat it as a stable unique identifier, not as a secret or authentication credential. Exposing it in the public ingest URL should not grant access to admin APIs, because admin APIs still require Better Auth session authentication.

The backend should resolve the ingest endpoint by `userId` and slug. If no active endpoint exists, the backend should reject the request without creating an inbound event.

### Inbound Event Identity

Inbound events are the durable record of each accepted event shot. Every accepted ingestion request should create a new inbound event GUID.

Required behavior:

- Generate a new inbound event `id` server-side for every accepted ingestion request.
- Use `crypto.randomUUID()` for inbound event ids.
- Do not reuse an existing inbound event for matching payloads.
- Do not deduplicate inbound events by endpoint, payload, headers, or producer-provided values in this epic.
- If the same producer sends the same payload to the same ingest endpoint twice, create two inbound events with two different GUIDs.
- Create a fresh set of webhook delivery rows for each accepted inbound event.

Producer correlation headers, such as `X-Correlation-ID` or `X-Request-ID`, can still be stored in the serialized inbound event headers for debugging, but they should not control inbound event identity.

### Rate Limiting

Public ingestion should be limited to 100 requests per second.

For the first implementation, an in-process limiter is acceptable. Future work can replace it with shared storage if the backend becomes horizontally scaled.

The rate limit should apply to:

- `POST /ingest/:userId/:uniqueIdentifier/events`

Prefer tracking limits per ingest endpoint when possible. A global fallback is acceptable for the first implementation if it keeps the code substantially simpler.

### Outbound Delivery Execution

When an inbound event is accepted, the backend should:

- Find all active webhook subscriptions for the ingest endpoint.
- Create one webhook delivery row for each active webhook subscription.
- Immediately attempt one outbound HTTP `POST` for each delivery.
- Send the inbound event payload as the outbound request body.
- Use `Content-Type: application/json`.
- Include useful metadata headers such as:
  - `X-Inbound-Event-Id`
  - `X-Webhook-Delivery-Id`
  - `X-Ingest-Endpoint-Id`
- Record one webhook delivery attempt for each outbound `POST`.
- Mark the delivery `succeeded` if the target responds with a `2xx` status.
- Mark the delivery `failed` if the target responds with a non-`2xx` status or the request errors.

For the first implementation, this can be synchronous and in-process. A short per-target timeout should be used so one slow subscription target does not hold the public ingest request open for too long.

Retries are out of scope for this epic. Failed deliveries should be recorded clearly enough that a future retry system can find and process them.

## Data Model

### `ingest_endpoints`

Stores public event ingestion endpoints created by authenticated users.

Fields:

- `id`: GUID primary key.
- `user_id`: Better Auth user id.
- `name`: human-readable display name.
- `slug`: URL-safe unique identifier.
- `description`: optional note.
- `is_active`: whether the endpoint accepts inbound events.
- `created_at`: creation timestamp.
- `updated_at`: last update timestamp.

Constraints and indexes:

- Unique `(user_id, slug)`.
- Index `user_id`.
- Index `(user_id, is_active)`.

### `webhook_subscriptions`

Stores target URLs subscribed to an ingest endpoint.

Fields:

- `id`: GUID primary key.
- `ingest_endpoint_id`: required link to `ingest_endpoints.id`.
- `user_id`: Better Auth user id.
- `target_url`: outbound webhook target URL.
- `description`: optional label or note.
- `is_active`: whether this subscription should receive deliveries.
- `created_at`: creation timestamp.
- `updated_at`: last update timestamp.

Constraints and indexes:

- Foreign key `ingest_endpoint_id`.
- Index `user_id`.
- Index `(ingest_endpoint_id, is_active)`.

Behavior:

- Subscriptions can only be active if their ingest endpoint is active.
- Deactivating an ingest endpoint should deactivate linked subscriptions without deleting them.
- Reactivating an ingest endpoint should not automatically reactivate subscriptions. The user should choose which subscriptions to reconnect.

### `inbound_events`

Stores the actual events received by ingest endpoints.

Fields:

- `id`: GUID primary key for the inbound event.
- `ingest_endpoint_id`: required link to `ingest_endpoints.id`.
- `user_id`: owner resolved from the ingest endpoint.
- `payload`: JSON payload serialized for SQLite.
- `headers`: selected request headers serialized for SQLite.
- `received_at`: timestamp when accepted.
- `status`: initial status such as `accepted`.

Constraints and indexes:

- Foreign key `ingest_endpoint_id`.
- Index `user_id`.
- Index `ingest_endpoint_id`.
- Index `received_at`.

### `webhook_deliveries`

Stores one delivery work item for one inbound event and one webhook subscription.

Fields:

- `id`: GUID primary key.
- `inbound_event_id`: required link to `inbound_events.id`.
- `webhook_subscription_id`: required link to `webhook_subscriptions.id`.
- `user_id`: owner id for filtering and authorization.
- `status`: `pending`, `in_progress`, `succeeded`, `failed`, or `retrying`.
- `next_attempt_at`: nullable timestamp for future retry scheduling.
- `created_at`: creation timestamp.
- `updated_at`: last update timestamp.

Constraints and indexes:

- Foreign key `inbound_event_id`.
- Foreign key `webhook_subscription_id`.
- Unique `(inbound_event_id, webhook_subscription_id)`.
- Index `user_id`.
- Index `(status, next_attempt_at)`.

### `webhook_delivery_attempts`

Stores one concrete attempt to deliver a webhook delivery.

Fields:

- `id`: GUID primary key.
- `webhook_delivery_id`: required link to `webhook_deliveries.id`.
- `attempt_number`: attempt sequence number for this delivery.
- `status`: `pending`, `succeeded`, or `failed`.
- `target_url`: URL attempted at the time of delivery.
- `request_headers`: selected outbound request headers serialized for SQLite.
- `request_body`: outbound request body snapshot serialized for SQLite.
- `response_status`: nullable HTTP response status.
- `response_headers`: nullable selected response headers serialized for SQLite.
- `response_body`: nullable limited response body sample.
- `error_message`: nullable transport or processing error.
- `started_at`: attempt start timestamp.
- `finished_at`: nullable completion timestamp.

Constraints and indexes:

- Foreign key `webhook_delivery_id`.
- Unique `(webhook_delivery_id, attempt_number)`.
- Index `webhook_delivery_id`.
- Index `status`.

## API Plan

### Ingest Endpoint Management

All routes in this section require Better Auth session authentication.

- `POST /api/ingest-endpoints`
  - Creates an ingest endpoint.
  - Accepts `name`, optional `uniqueIdentifier`, and optional `description`.
  - If `uniqueIdentifier` is omitted, derive the slug from `name`.
  - Returns the ingest endpoint and public ingest URL.

- `GET /api/ingest-endpoints`
  - Lists ingest endpoints owned by the authenticated user.

- `GET /api/ingest-endpoints/:id`
  - Returns one ingest endpoint owned by the authenticated user.

- `PATCH /api/ingest-endpoints/:id`
  - Updates `name`, `description`, and `isActive`.
  - If `isActive` becomes false, deactivate linked webhook subscriptions without deleting them.

### Webhook Subscription Management

All routes in this section require Better Auth session authentication.

- `POST /api/ingest-endpoints/:id/subscriptions`
  - Creates a webhook subscription for an ingest endpoint.
  - Requires `targetUrl`.
  - Accepts optional `description`.
  - Rejects active subscription creation for inactive ingest endpoints.

- `GET /api/ingest-endpoints/:id/subscriptions`
  - Lists subscriptions for one ingest endpoint.

- `GET /api/webhook-subscriptions`
  - Lists subscriptions owned by the authenticated user.
  - Can optionally filter by `ingestEndpointId`.

- `GET /api/webhook-subscriptions/:id`
  - Returns one subscription owned by the authenticated user.

- `PATCH /api/webhook-subscriptions/:id`
  - Updates `targetUrl`, `description`, and `isActive`.
  - Rejects activation if the parent ingest endpoint is inactive.

### Public Event Ingestion

This route does not require Better Auth session authentication.

- `POST /ingest/:userId/:uniqueIdentifier/events`
  - Resolves active ingest endpoint by `userId` and slug.
  - Accepts a non-empty JSON object payload.
  - Creates a new inbound event with a new GUID.
  - Creates webhook delivery rows for active subscriptions.
  - Immediately attempts one outbound HTTP `POST` per active subscription.
  - Records one delivery attempt per outbound `POST`.
  - Returns minimal response data:

```json
{
  "event": {
    "id": "generated-inbound-event-id",
    "status": "accepted",
    "deliveryCount": 3,
    "attemptedDeliveryCount": 3
  }
}
```

### Inspection APIs

All routes in this section require Better Auth session authentication.

- `GET /api/inbound-events`
  - Lists recent inbound events for the authenticated user.
  - Can optionally filter by `ingestEndpointId`.

- `GET /api/inbound-events/:id`
  - Returns one inbound event owned by the authenticated user.

- `GET /api/webhook-deliveries`
  - Lists webhook deliveries owned by the authenticated user.
  - Can optionally filter by `inboundEventId`, `webhookSubscriptionId`, or `status`.

- `GET /api/webhook-deliveries/:id`
  - Returns one webhook delivery owned by the authenticated user.

- `GET /api/webhook-deliveries/:id/attempts`
  - Lists attempts for one webhook delivery owned by the authenticated user.

## Migration and Refactor Strategy

This epic should intentionally migrate away from the old names.

Suggested mapping:

- `webhook_events` -> `ingest_endpoints`
- `webhook_registrations` -> `webhook_subscriptions`
- `webhook_event_occurrences` -> `inbound_events`
- old `webhook_registration_id` -> new `ingest_endpoint_id` or public slug depending on context

Implementation options:

- Since this is still early and local SQLite data is disposable, prefer creating the new tables and retiring the old route names rather than doing a complex data migration.
- Keep old tables ignored if they already exist locally, or document a local DB reset.
- Remove or replace old API routes once the new route set is implemented.
- Update README examples so new terminology is the only documented path.

## Validation

- Reject unauthenticated admin management requests with `401`.
- Reject invalid or empty endpoint names.
- Reject empty generated slugs.
- Reject duplicate slug creation for the same user with `409`.
- Reject invalid subscription target URLs.
- Reject attempts to activate a subscription whose ingest endpoint is inactive.
- Reject public ingestion for unknown or inactive endpoints.
- Reject public ingestion with non-object or empty payloads.
- Enforce public ingestion body size limits.
- Enforce public ingestion rate limits with `429`.

## Acceptance Criteria

- Authenticated users can create ingest endpoints.
- Ingest endpoint creation generates a URL-safe slug from human-readable input.
- Duplicate ingest endpoint slugs for the same user are rejected with `409`.
- Ingest endpoint responses include the public ingest URL.
- Authenticated users can create webhook subscriptions for ingest endpoints they own.
- Webhook subscriptions replace the old "Webhook Registration" terminology in backend APIs and docs.
- Public event ingestion works at `/ingest/:userId/:uniqueIdentifier/events` without Better Auth session authentication.
- Unknown or inactive ingest endpoints reject inbound events.
- Accepted inbound events are persisted with a generated GUID.
- Repeated requests with the same payload create separate inbound events with separate GUIDs.
- Accepted inbound events create webhook delivery rows for active subscriptions.
- Accepted inbound events immediately attempt one HTTP `POST` to each active webhook subscription target.
- Delivery attempts are recorded with target URL, status, response metadata, and error information when applicable.
- Successful `2xx` delivery attempts mark their webhook delivery as `succeeded`.
- Failed or errored delivery attempts mark their webhook delivery as `failed`.
- Authenticated users can inspect their own ingest endpoints, subscriptions, inbound events, deliveries, and attempts.
- Users cannot inspect backend records owned by other users.
- Public ingestion is rate-limited to 100 requests per second.
- Backend typecheck and build pass.
- Backend README documents the new model and endpoints.

## Open Questions

- None currently.

## Implementation Notes

- Backend framework remains Fastify.
- Authentication remains Better Auth for admin management routes.
- SQLite remains the persistence layer.
- Use `crypto.randomUUID()` for internal ids.
- Treat public ingest URLs as identifiers, not secrets.
- Use the Better Auth `userId` directly in public ingest URLs for this epic.
- Keep the first delivery implementation synchronous, simple, and observable.
- Keep the first slug implementation deterministic and boring.
- Prefer clear domain names in code, table names, and response shapes over preserving earlier naming.

## Future Follow-Ups

- Add request signing for producer authentication.
- Add API keys for producer authentication.
- Add stronger rate limiting backed by shared storage.
- Add asynchronous delivery worker.
- Add retry scheduling.
- Add replay controls for inbound events.
- Add delivery-attempt response redaction and retention rules.
- Add frontend management pages for ingest endpoints, subscriptions, inbound events, and deliveries.
