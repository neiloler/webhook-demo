# Epic 3: Webhook Registration and Event Ingestion

## Goal

Add the first webhook-domain backend capabilities: authenticated users can register webhook events, attach webhook target URLs to those registered events, and fire event occurrences that are recorded in SQLite with generated GUIDs.

## Core Model

There are three separate concepts in this epic:

- **Registered Webhook Event**: the durable thing a user creates first. It generates a `webhookRegistrationId` GUID. This id represents an event that the system is allowed to receive.
- **Webhook Registration**: a target URL subscribed to a registered webhook event. It must reference an existing `webhookRegistrationId`.
- **Webhook Event Occurrence**: one fired event, or one "shot" through the backend. It gets its own generated `id` GUID for tracking that specific occurrence.

This keeps event firing lightweight while still rejecting unknown/unregistered events.

## Scope

- Add backend persistence for registered webhook events.
- Generate a `webhookRegistrationId` GUID when creating a registered webhook event.
- Add backend persistence for webhook URL registrations.
- Require a valid `webhookRegistrationId` before creating a webhook URL registration.
- Add backend persistence for fired webhook event occurrences.
- Require a valid `webhookRegistrationId` when an event occurrence is fired.
- Generate a separate GUID for each fired event occurrence before it is stored.
- Keep registered webhook event and webhook URL registration management session-authenticated.
- Allow event occurrence firing without Better Auth session authentication.
- Add basic event ingestion guardrails so unauthenticated firing is not completely unconstrained.
- Keep the implementation focused on registration, validation, and storage, leaving delivery/retry execution for a future epic.

## Non-Goals

- Actually delivering events to registered webhook URLs.
- Retrying failed deliveries.
- Delivery attempt logs.
- Webhook signing, API keys, or public producer authentication.
- Frontend management screens for registered webhook events or webhook URLs.
- Multi-tenant organization modeling beyond associating records with the authenticated user.

## Requirements

### Data Model

Add SQLite-backed tables for registered webhook events, webhook URL registrations, and fired event occurrences.

#### Registered Webhook Events

Each registered webhook event should store:

- `webhookRegistrationId`: generated GUID and primary identifier for this registered event.
- `userId`: Better Auth user id that owns the registered event.
- `name`: user-facing event name.
- `description`: optional user-facing note.
- `isActive`: whether this registered event can accept fired occurrences.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.

#### Webhook Registrations

Each registered webhook URL should store:

- `id`: generated primary key for this target URL registration.
- `webhookRegistrationId`: required link to an existing registered webhook event.
- `userId`: Better Auth user id that owns the registration.
- `url`: target webhook URL.
- `description`: optional user-facing label or note.
- `isActive`: whether the URL should be considered active.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.

The backend must reject webhook URL registration if the provided `webhookRegistrationId` does not exist or is not owned by the authenticated user.

A webhook URL registration may only be active when it has a valid `webhookRegistrationId` linked to an active registered webhook event.

#### Webhook Event Occurrences

Each fired event occurrence should store:

- `id`: generated GUID for this specific fired event occurrence.
- `webhookRegistrationId`: required link to an existing registered webhook event.
- `userId`: owner resolved from the registered webhook event.
- `payload`: raw JSON payload serialized for SQLite.
- `headers`: useful request headers serialized for SQLite.
- `receivedAt`: timestamp when the backend accepted the event.
- `status`: initial event state, such as `received`.

The backend must reject fired event occurrences if the provided `webhookRegistrationId` does not exist or is inactive.

### GUID Generation

- Generate `webhookRegistrationId` server-side when a registered webhook event is created.
- Generate event occurrence `id` server-side when an event occurrence is fired.
- Use Node.js `crypto.randomUUID()` unless there is a strong reason to introduce another dependency.
- Return generated ids to callers.
- Treat the event occurrence `id` as the stable identifier used by future retry, logging, and delivery workflows.

### Registered Webhook Event API

Add authenticated backend endpoints for registered webhook events.

- `POST /api/webhook-events`
  - Creates a registered webhook event for the authenticated user.
  - Generates and returns `webhookRegistrationId`.
  - Accepts a required name and optional description.
  - Defaults `isActive` to true.

- `GET /api/webhook-events`
  - Lists registered webhook events for the authenticated user.

- `GET /api/webhook-events/:webhookRegistrationId`
  - Returns one registered webhook event owned by the authenticated user.
  - Returns `404` if the registered event does not exist or is not owned by the user.

- `PATCH /api/webhook-events/:webhookRegistrationId`
  - Updates mutable fields such as `name`, `description`, and `isActive`.
  - Only allows updates for records owned by the authenticated user.
  - If `isActive` is set to false, all webhook URL registrations linked to that `webhookRegistrationId` should also be set to inactive.
  - Deactivating a registered webhook event must not delete linked webhook URL registrations.

### Webhook URL Registration API

Add authenticated backend endpoints for webhook URL registrations.

- `POST /api/webhooks`
  - Creates a webhook URL registration for the authenticated user.
  - Requires a valid `webhookRegistrationId`.
  - Requires a valid URL.
  - Accepts an optional description.
  - Defaults `isActive` to true.

- `GET /api/webhooks`
  - Lists webhook URL registrations for the authenticated user.
  - Can optionally filter by `webhookRegistrationId`.
  - Does not return registrations owned by other users.

- `GET /api/webhooks/:id`
  - Returns one webhook URL registration owned by the authenticated user.
  - Returns `404` if the registration does not exist or is not owned by the user.

- `PATCH /api/webhooks/:id`
  - Updates mutable fields such as `url`, `description`, and `isActive`.
  - Only allows updates for records owned by the authenticated user.
  - Rejects attempts to activate the webhook URL registration unless it has a valid `webhookRegistrationId` linked to an active registered webhook event.

### Event Ingestion API

Add an endpoint for recording fired event occurrences.

- `POST /api/events`
  - Requires a valid `webhookRegistrationId`.
  - Accepts a JSON request body containing the event payload.
  - Verifies the registered webhook event exists and is active.
  - Generates a GUID for this event occurrence.
  - Persists the event occurrence payload and metadata in SQLite.
  - Returns `201` with the generated event occurrence id.

Event firing should not require a Better Auth session. The request should not accept a `userId`; the backend should resolve ownership from the registered webhook event referenced by `webhookRegistrationId`.

Because this endpoint is unauthenticated, it should include basic defensive guardrails in this epic:

- Apply rate limiting to `POST /api/events`.
- Limit event firing to 100 requests per second.
- Keep request body size limits modest.
- Reject unknown or inactive `webhookRegistrationId` values before storing an event occurrence.
- Return only the generated event occurrence id and minimal status information.

Public producer credentials, API keys, or signing secrets should still be handled in a future epic.

### Event Inspection API

Add minimal authenticated read endpoints so stored event occurrences can be verified locally.

- `GET /api/events`
  - Lists recent event occurrences for the authenticated user.
  - Can optionally filter by `webhookRegistrationId`.

- `GET /api/events/:id`
  - Returns one event occurrence owned by the authenticated user.
  - Returns `404` if the event occurrence does not exist or is not owned by the user.

### Validation

- Reject registered webhook event creation without a name.
- Reject webhook URL registrations without a known `webhookRegistrationId`.
- Reject webhook URL registrations with invalid URLs.
- Reject attempts to activate webhook URL registrations linked to inactive or unknown registered webhook events.
- Reject fired event occurrences without a known active `webhookRegistrationId`.
- Reject non-object or empty event payloads.
- Rate-limit unauthenticated event firing requests to 100 requests per second.
- Keep request validation simple and explicit for this epic.
- Return clear `400`, `401`, `404`, `429`, and `500` JSON responses.

### Database Setup

- Keep using the existing backend SQLite database path from Epic 1.
- Add a backend-owned schema initialization or migration path for webhook-domain tables.
- Do not rely on Better Auth migrations for non-auth tables.
- Make it easy to recreate the local SQLite database during development.

## Proposed Implementation Plan

1. Add a small backend database module that opens the existing SQLite database path.
2. Add schema initialization for registered webhook events, webhook URL registrations, and event occurrences.
3. Add TypeScript types for registered events, URL registrations, event occurrences, and request bodies.
4. Extract or reuse the existing session guard so management routes can require authentication.
5. Implement registered webhook event routes under `/api/webhook-events`.
6. Implement webhook URL registration routes under `/api/webhooks`.
7. Implement unauthenticated event occurrence ingestion at `POST /api/events`.
8. Implement authenticated event occurrence read routes under `/api/events`.
9. Add basic rate limiting for `POST /api/events` at 100 requests per second.
10. Generate `webhookRegistrationId` with `crypto.randomUUID()` when a registered webhook event is created.
11. Generate event occurrence `id` with `crypto.randomUUID()` inside the ingestion handler.
12. Store JSON payloads and selected headers as serialized JSON strings.
13. Update backend README docs with the new endpoints and example curl commands.
14. Run typecheck, build, and local curl verification against authenticated management requests and unauthenticated event firing.

## Acceptance Criteria

- Authenticated users can create registered webhook events.
- Creating a registered webhook event returns a generated `webhookRegistrationId`.
- Unauthenticated registered-event requests are rejected with `401`.
- Authenticated users can create webhook URL registrations only for known `webhookRegistrationId` values they own.
- Invalid webhook URLs are rejected with `400`.
- Unknown `webhookRegistrationId` values are rejected when creating webhook URL registrations.
- Deactivating a registered webhook event deactivates linked webhook URL registrations without deleting them.
- Webhook URL registrations cannot be activated unless their `webhookRegistrationId` points to an active registered webhook event.
- Unauthenticated callers can fire an event occurrence to `POST /api/events` with a known active `webhookRegistrationId`.
- Unknown or inactive `webhookRegistrationId` values are rejected when firing event occurrences.
- Event firing requests are rate-limited to 100 requests per second.
- Every accepted event occurrence is assigned a generated GUID.
- Every accepted event occurrence is recorded in SQLite with payload, metadata, owner, registered-event link, and received timestamp.
- `POST /api/events` returns `201` and the generated event occurrence id.
- Users can list and inspect only their own registered webhook events, webhook URL registrations, and event occurrences.
- The backend typecheck and build pass.
- The backend README documents the new local endpoints.

## Open Questions

- None currently.

## Implementation Notes

- Backend framework remains Fastify.
- Database remains SQLite.
- Registered webhook event and webhook URL registration management remains Better Auth session-based for this epic.
- Event occurrence firing at `POST /api/events` does not require Better Auth session authentication.
- `webhookRegistrationId` is the durable registered-event id, not the id of a fired event occurrence.
- Event occurrence `id` is the generated GUID for tracking one specific fired event.
- Future retry and delivery systems should use the event occurrence `id` as their stable reference.

## Future Follow-Ups

- Add delivery rows for each active webhook URL registration when an event occurrence is received.
- Add delivery attempts and retry scheduling.
- Add delivery logs tied to event occurrence ids.
- Add webhook signing secrets.
- Add API keys or producer credentials for public event ingestion.
- Add stronger abuse prevention for public event ingestion.
- Add frontend management views for registered webhook events, URL registrations, and event occurrences.
- Add filtering and pagination for event lists.
