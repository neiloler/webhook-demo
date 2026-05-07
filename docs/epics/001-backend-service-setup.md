# Epic 1: Backend Service Setup

## Goal

Create the initial backend service for the webhook platform inside a monorepo structure. The backend should provide a minimal authenticated API surface, use Better Auth for authentication, and persist data in SQLite.

## Scope

- Create a backend application folder in the monorepo.
- Use Node.js for the backend runtime.
- Use Fastify as the backend web framework.
- Configure Better Auth for backend authentication concerns.
- Add middleware or request handling that verifies a user is authenticated before allowing protected backend calls.
- Configure SQLite as the backend database.
- Provide at least one protected backend endpoint that the frontend can call as a sanity check.

## Non-Goals

- Full webhook ingestion, delivery, retry, or subscription management.
- Production-grade authorization roles or organization support.
- Deployment infrastructure.
- Advanced database migrations beyond what is needed for initial setup.

## Requirements

### Monorepo Backend Structure

- Add a dedicated backend folder at the repo root.
- Use Node.js as the backend runtime.
- Use Fastify as the backend web framework.
- Keep backend-specific package configuration, source code, database setup, and local development scripts inside that folder unless shared tooling is introduced later.
- Prefer simple local commands for installation and development.

### Authentication

- Use Better Auth as the backend authentication provider.
- Start with the simplest username or email plus password authentication flow.
- Defer OAuth, magic links, and more robust provider options until they are needed.
- Let the backend own and expose all Better Auth routes directly.
- Ensure protected API routes reject unauthenticated requests.
- Keep the first authentication flow simple and suitable for local development.

### Database

- Use SQLite for local persistence.
- Store database files in a predictable local-only location.
- Ensure generated database files are ignored by git.

### Protected Sanity Endpoint

- Add one minimal protected endpoint for frontend verification.
- The endpoint should return enough information for the frontend to confirm:
  - The backend is reachable.
  - The request is authenticated.
  - The authenticated user/session is being recognized.

## Acceptance Criteria

- A backend app exists in the monorepo.
- The backend can be started locally with a documented command.
- Better Auth is configured in the backend.
- SQLite is configured and usable by the backend.
- An unauthenticated request to a protected endpoint is rejected.
- An authenticated request to the same protected endpoint succeeds.
- The backend exposes a simple endpoint the frontend can use for a future sanity check.

## Implementation Notes

- Backend app folder: `backend/`.
- Local backend command: `npm run dev:backend`.
- Better Auth routes are mounted directly on the backend at `/api/auth/*`.
- Protected sanity endpoint: `GET /api/me`.
- Health endpoint: `GET /health`.
- SQLite database path defaults to `backend/data/auth.sqlite`.

## Open Questions

- None currently.

## Future Follow-Ups

- Define webhook domain models.
- Add webhook endpoint creation and management.
- Add webhook event ingestion.
- Add delivery attempts, retries, and logs.
- Add API keys or signing secrets for webhook producers.
