# Epic 2: Frontend Setup

## Goal

Create the initial frontend application for managing the webhook service. The frontend should be a simple Next.js app that uses Better Auth, can run locally without deployment complexity, remains deployable to Vercel later, and includes a bare minimum sanity check against the backend.

## Scope

- Create a frontend application folder in the monorepo.
- Set up a minimal TypeScript Next.js app.
- Configure Better Auth client-side integration.
- Keep the app compatible with Vercel deployment expectations.
- Add a simple authenticated page or flow that can call the backend sanity endpoint.

## Non-Goals

- Full webhook management UI.
- Team, organization, billing, or account settings pages.
- Production deployment setup beyond keeping the app Vercel-friendly.
- Advanced styling or a final design system.

## Requirements

### Monorepo Frontend Structure

- Add a dedicated frontend folder at the repo root: `frontend/`.
- Keep frontend-specific package configuration, app code, environment examples, and local development scripts inside that folder unless shared tooling is introduced later.
- Ensure frontend and backend can be run independently during local development.
- Add root-level workspace scripts for common frontend commands.

### Next.js Setup

- Use Next.js for the frontend app.
- Use TypeScript.
- Use the App Router.
- Keep the initial app minimal and easy to run locally.
- Avoid unnecessary deployment-specific complexity in the first setup.
- Preserve compatibility with Vercel conventions.
- Do not introduce a UI component package yet.
- Keep styling local and simple until the product UI is planned in a future epic.

### Authentication

- Use Better Auth on the frontend to communicate with the backend auth setup from Epic 1.
- Create a frontend auth client with `createAuthClient` from `better-auth/react`.
- Configure the frontend auth client to use the backend Better Auth base URL.
- Use the backend-owned Better Auth routes at `/api/auth/*`; do not proxy auth through Next.js for this epic.
- Provide a minimal email and password sign-up/sign-in flow for local development.
- Make the authenticated state visible enough to confirm the auth flow works.
- Provide a way to sign out.

### Backend Sanity Check

- Add a minimal frontend experience that can call the backend protected sanity endpoint.
- Use `GET /api/me` from the backend as the protected sanity endpoint.
- Send credentials with the request so the Better Auth session cookie is included.
- The UI should clearly show whether:
  - The frontend is running.
  - The backend is reachable.
  - The current request is authenticated.

### Environment Configuration

- Add `frontend/.env.example`.
- Use `NEXT_PUBLIC_BACKEND_URL` for browser-side calls to the backend.
- Default local backend URL should be `http://localhost:4000`.
- Keep environment variable requirements compatible with Vercel.

### Local Development

- Add a documented frontend dev command.
- Add root-level scripts for:
  - Starting the frontend.
  - Building the frontend.
  - Type-checking or linting the frontend, depending on the generated Next.js setup.
- Keep the backend and frontend independent enough that either can be started separately.

## Proposed Implementation Plan

1. Update the monorepo workspace configuration to include `frontend/`.
2. Scaffold a TypeScript Next.js app in `frontend/` using the App Router.
3. Add `better-auth` to the frontend dependencies.
4. Create a small auth client module that points at `NEXT_PUBLIC_BACKEND_URL`.
5. Build a minimal first screen with:
   - Sign-up form.
   - Sign-in form.
   - Sign-out action.
   - Current session display.
   - Backend sanity check button/status.
6. Call the backend `GET /api/me` endpoint with credentials included.
7. Add frontend environment examples and README notes.
8. Verify the frontend starts locally, builds successfully, and can authenticate against the Epic 1 backend.

## Acceptance Criteria

- A Next.js frontend app exists in the monorepo.
- The frontend can be started locally with a documented command.
- The frontend uses TypeScript.
- The frontend uses the App Router.
- Better Auth client integration is configured.
- The frontend can authenticate through the backend auth service.
- The frontend can sign up, sign in, show session state, and sign out using the backend-owned Better Auth routes.
- The frontend includes a basic sanity check against the backend `GET /api/me` endpoint.
- Authenticated backend sanity checks succeed.
- Unauthenticated backend sanity checks show the user that authentication is required.
- The app remains simple enough to run locally without Vercel deployment.
- The app is structured so it can be deployed to Vercel later without major restructuring.

## Open Questions

- None currently.

## Implementation Notes

- Frontend app folder: `frontend/`.
- Local frontend command: `npm run dev:frontend`.
- Expected local frontend URL: `http://localhost:3000`.
- Expected local backend URL: `http://localhost:4000`.
- Backend auth routes remain owned by Fastify at `http://localhost:4000/api/auth/*`.
- Backend protected sanity endpoint remains `http://localhost:4000/api/me`.

## Future Follow-Ups

- Build the webhook dashboard.
- Add webhook creation and editing screens.
- Add event delivery logs.
- Add endpoint secret display and rotation.
- Add filtering, search, and debugging views for webhook events.
- Add polished navigation and layout.
- Add validation and error handling fit for production.
- Add Vercel project configuration only when deployment is ready.
