# Epic 2: Frontend Setup

## Goal

Create the initial frontend application for managing the webhook service. The frontend should be a simple Next.js app that uses Better Auth, can run locally without deployment complexity, remains deployable to Vercel later, and includes a bare minimum sanity check against the backend.

## Scope

- Create a frontend application folder in the monorepo.
- Set up a minimal Next.js app.
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

- Add a dedicated frontend folder at the repo root.
- Keep frontend-specific package configuration, app code, environment examples, and local development scripts inside that folder unless shared tooling is introduced later.
- Ensure frontend and backend can be run independently during local development.

### Next.js Setup

- Use Next.js for the frontend app.
- Keep the initial app minimal and easy to run locally.
- Avoid unnecessary deployment-specific complexity in the first setup.
- Preserve compatibility with Vercel conventions.

### Authentication

- Use Better Auth on the frontend to communicate with the backend auth setup.
- Provide a minimal way to sign in or otherwise establish an authenticated session during local development.
- Make the authenticated state visible enough to confirm the auth flow works.

### Backend Sanity Check

- Add a minimal frontend experience that can call the backend protected sanity endpoint.
- The UI should clearly show whether:
  - The frontend is running.
  - The backend is reachable.
  - The current request is authenticated.

## Acceptance Criteria

- A Next.js frontend app exists in the monorepo.
- The frontend can be started locally with a documented command.
- Better Auth client integration is configured.
- The frontend can authenticate through the backend auth service.
- The frontend includes a basic sanity check against the backend.
- The app remains simple enough to run locally without Vercel deployment.
- The app is structured so it can be deployed to Vercel later without major restructuring.

## Open Questions

- Should the frontend use the App Router or Pages Router?
- Which UI package, if any, should be introduced later?
- Should local auth begin with email/password, magic link, or OAuth?
- How should frontend environment variables be named for backend API and auth URLs?

## Future Follow-Ups

- Build the webhook dashboard.
- Add webhook creation and editing screens.
- Add event delivery logs.
- Add endpoint secret display and rotation.
- Add filtering, search, and debugging views for webhook events.
