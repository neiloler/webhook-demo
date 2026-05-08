# Epic 4: Frontend Dashboard and User Admin

## Goal

Build out the frontend from a basic auth sanity-check screen into an authenticated dashboard for managing and observing the webhook service.

The homepage should become the main dashboard. It should show a user's ingest endpoints, inbound event activity, webhook deliveries, delivery attempts, and manual recovery actions. It should also include a minimal user admin section where a signed-in admin user can change their password.

## Context

Epic 2 created the initial Next.js frontend with Better Auth integration and a backend sanity check.

Epic 5 reshapes the backend domain around:

- **Ingest Endpoint**: where inbound events arrive.
- **Inbound Event**: one received event shot with its own GUID.
- **Webhook Subscription**: a target URL connected to an ingest endpoint.
- **Webhook Delivery**: one outbound delivery created for an inbound event and subscription.
- **Webhook Delivery Attempt**: one concrete attempt to send a delivery.

Epic 4 should use this newer vocabulary in the UI. Avoid the older "Webhook Registration" terminology.

## Scope

- Put the app behind an authenticated login flow.
- Make the authenticated homepage a dashboard.
- Show ingest endpoint metrics for the signed-in user.
- Show recent inbound events.
- Show webhook deliveries and delivery attempts.
- Show dashboard sections as display-first tables, with a `+` icon action for adding new records where creation is supported.
- Add row-level edit actions with a pencil icon for editable records.
- Provide manual recovery buttons for:
  - Retrying a webhook delivery.
  - Retrying delivery work for a specific webhook subscription.
  - Reprocessing an inbound event through downstream delivery handling.
- Add a minimal user admin section for changing password.
- Keep the design functional and clean rather than fully polished.
- Keep the frontend compatible with local development and future Vercel deployment.

## Non-Goals

- A full design system.
- Team or organization management.
- Billing.
- Advanced role-based access control.
- Complex filtering and saved views.
- Real-time websocket updates.
- Production-grade analytics charts.
- Public documentation pages.

## Authentication Requirements

### Auth-Gated App

- Unauthenticated users should not see dashboard data.
- Unauthenticated users should be directed to a login screen.
- Signed-in users should land on the dashboard.
- The frontend should continue using Better Auth against the backend-owned auth routes.
- All authenticated API calls should include credentials.

### Login Flow

The login screen should include:

- Email input.
- Password input.
- Sign-in action.
- Link or secondary mode for sign-up if local development still needs account creation.
- Clear error messages for failed login.
- Redirect to the dashboard after successful authentication.

### Session Handling

- Show a loading state while session status is being resolved.
- Redirect signed-out users away from protected screens.
- Provide a visible sign-out action.
- Avoid flashing protected dashboard data before auth state is known.

## Dashboard Requirements

### Dashboard Summary

The dashboard homepage should provide a quick operational snapshot for the authenticated user.

Suggested summary metrics:

- Total ingest endpoints.
- Active ingest endpoints.
- Inbound events received in the last 24 hours.
- Webhook deliveries created in the last 24 hours.
- Failed deliveries.
- Pending or retryable deliveries.

These metrics can be computed by the backend or derived from dashboard API responses for the first version. Prefer backend-provided summaries once available.

### Ingest Endpoint Table

Show a table of ingest endpoints the signed-in user has access to. For this app, that means ingest endpoints owned by the user's Better Auth `userId`.

Columns:

- Name.
- Public ingest URL or slug.
- Active status.
- Inbound event count.
- Delivery count.
- Failed delivery count.
- Active subscription count.
- Last inbound event timestamp.
- Created timestamp.

Expected row actions:

- Add a new ingest endpoint from the section header with a `+` icon button.
- Copy public ingest URL.
- View endpoint detail.
- Edit endpoint with a pencil icon button.
- Toggle active status if the backend supports it.

### Recent Inbound Events

Show a recent inbound events section.

Columns:

- Inbound event id.
- Ingest endpoint.
- Status.
- Received timestamp.
- Delivery count.
- Failed delivery count.
- Payload preview.

Expected row actions:

- View event detail.
- Retry or replay event handling.

Reprocessing an inbound event means: take an existing inbound event record and run downstream handling again so the user does not need the original producer to resend the event. When triggered at the inbound event level, this should retry everything downstream for that inbound event.

The UI language may use "Replay" or "Retry" depending on what feels clearest in the final screen, but the behavior should be: rerun downstream delivery handling for the selected inbound event.

### Webhook Subscription Management

Show webhook subscriptions connected to ingest endpoints.

This can be a dedicated section, an endpoint detail area, or a table grouped under each ingest endpoint.

Columns:

- Subscription id.
- Ingest endpoint.
- Target URL.
- Active status.
- Delivery count.
- Failed delivery count.
- Last delivery timestamp.
- Created timestamp.

Expected actions:

- Add a new webhook subscription with a `+` icon button.
- Edit subscription with a pencil icon button.
- Retry downstream work for the selected subscription when applicable.

Retrying at the webhook subscription level means: retry only the delivery path for that subscription, not every subscription attached to the inbound event.

### Webhook Deliveries and Attempts

Show a list of triggered output. In the new vocabulary, "triggered output" means webhook deliveries created from inbound events and the attempts made to send them.

Columns:

- Delivery id.
- Inbound event id.
- Ingest endpoint.
- Webhook subscription target URL.
- Delivery status.
- Attempt count.
- Last attempt status.
- Last response status.
- Last attempted timestamp.
- Next attempt timestamp if retry scheduling exists.

Expected row actions:

- View delivery detail.
- Retry delivery.
- Edit related webhook subscription with a pencil icon when shown in context.

Retrying a delivery means: create a new delivery attempt for an existing webhook delivery and POST the inbound event payload to the subscription target again.

### Detail Views

For the first version, detail views can be simple route pages or expandable panels.

Useful details:

- Full inbound event payload.
- Stored inbound request headers.
- Delivery status and target URL.
- Attempt timeline.
- Attempt request body snapshot.
- Attempt response status.
- Attempt response body sample.
- Error message for failed attempts.

## User Admin Requirements

Add a minimal authenticated user admin area.

Suggested route:

```text
/settings/account
```

The page should include:

- Current signed-in user's email.
- Change password form.
- Current password input.
- New password input.
- Confirm new password input.
- Submit action.
- Success and error states.

Validation:

- New password and confirmation must match.
- New password should meet the backend or Better Auth minimum password requirements.
- Current password is required.
- The page requires an authenticated session.

## Frontend Routes

Suggested route structure:

- `/login`
  - Public route for sign-in/sign-up.

- `/`
  - Authenticated dashboard homepage.

- `/ingest-endpoints/:id`
  - Authenticated endpoint detail.

- `/inbound-events/:id`
  - Authenticated inbound event detail.

- `/webhook-deliveries/:id`
  - Authenticated delivery detail and attempt timeline.

- `/settings/account`
  - Authenticated account settings and password change.

For the first implementation, the detail routes may be deferred if the dashboard can expose enough detail inline. The route structure should still inform component and API client organization.

## Backend API Dependencies

Epic 4 depends on the backend exposing authenticated APIs from Epic 5.

Dashboard data:

- `GET /api/ingest-endpoints`
- `POST /api/ingest-endpoints`
- `PATCH /api/ingest-endpoints/:id`
- `POST /api/ingest-endpoints/:id/subscriptions`
- `PATCH /api/webhook-subscriptions/:id`
- `GET /api/inbound-events`
- `GET /api/webhook-deliveries`
- `GET /api/webhook-deliveries/:id/attempts`

Useful additions for dashboard metrics:

- `GET /api/dashboard/summary`
- `GET /api/ingest-endpoints/:id/summary`

Manual recovery actions:

- `POST /api/webhook-deliveries/:id/retry`
  - Creates a new delivery attempt for an existing delivery.

- `POST /api/inbound-events/:id/reprocess`
  - Re-runs downstream handling for all active subscriptions attached to the inbound event's ingest endpoint.

- `POST /api/webhook-subscriptions/:id/retry`
  - Retries delivery work only for the selected webhook subscription.
  - If this needs an inbound event context, the backend endpoint may require an `inboundEventId` in the request body.

User admin:

- Better Auth password-change endpoint or client method.

If these backend endpoints do not exist yet, the frontend should be built so the data-fetching layer can be wired once the backend lands.

## UI and UX Requirements

- Use the existing Next.js App Router.
- Use TypeScript.
- Keep the interface dense and operational, like a service dashboard.
- Prefer tables and status badges over marketing-style cards.
- Use clear loading, empty, error, and success states.
- Keep page sections unframed or lightly framed; use cards only for compact repeated items or forms.
- Make the dashboard usable on desktop first, with responsive behavior for narrower screens.
- Avoid decorative hero sections.
- Avoid adding a UI component library unless the implementation truly needs one.
- Use icons from the existing icon library for common actions.
- Create a reusable component in `frontend/components/` for icon-only and icon+text action buttons.
- Use a plus icon for create actions.
- Use a pencil icon for edit actions.
- Do not allow editing GUIDs or generated ids in any frontend form.

## State and Data Fetching

For the first implementation:

- Keep data fetching simple with typed fetch helpers.
- Centralize backend API calls in a small frontend client module.
- Include credentials on authenticated backend requests.
- Refresh dashboard data after manual retry or reprocess actions.
- Poll dashboard data every 10 seconds while the authenticated dashboard is visible.
- Leave event-driven updates or backend push notifications for a future epic.

Recommended refresh behavior:

- Initial load fetches summary, ingest endpoints, recent inbound events, and recent deliveries.
- Manual retry refreshes the affected delivery and dashboard summary.
- Manual reprocess refreshes the affected inbound event, deliveries, and dashboard summary.

## Proposed Implementation Plan

1. Add an auth gate for protected frontend routes.
2. Move the current auth sanity-check experience into a dedicated login route or replace it with a real login screen.
3. Build a dashboard shell with navigation, session display, and sign-out.
4. Add typed frontend API helpers for backend dashboard data.
5. Create reusable action button components in `frontend/components/` using plus and pencil icons from the icon library.
6. Build dashboard summary metrics.
7. Build ingest endpoint table with create and edit actions.
8. Build webhook subscription display with create, edit, and scoped retry actions.
9. Build recent inbound events table with event-level retry or replay.
10. Build webhook deliveries and attempts table with delivery retry.
11. Add typed API calls for backend create/edit endpoints and manual retry/reprocess endpoints.
12. Add 10-second dashboard polling while authenticated.
13. Add account settings page with change password form.
14. Add loading, empty, error, and success states.
15. Verify authenticated access, sign-out behavior, and protected-route redirects.
16. Run frontend typecheck and build.

## Acceptance Criteria

- Unauthenticated users are directed to a login flow.
- Authenticated users can access the dashboard homepage.
- The dashboard uses the Epic 5 vocabulary: ingest endpoints, inbound events, webhook subscriptions, deliveries, and attempts.
- The dashboard shows summary metrics for the signed-in user's webhook activity.
- The dashboard shows a table of ingest endpoints owned by the signed-in user.
- The dashboard includes a `+` icon action for creating ingest endpoints.
- Ingest endpoint rows include a pencil icon edit action.
- Webhook subscription rows include a pencil icon edit action.
- Editable forms do not allow changing GUIDs or generated ids.
- The dashboard shows recent inbound events.
- The dashboard shows webhook deliveries and attempt counts.
- Users can trigger a manual delivery retry from the frontend.
- Users can trigger manual inbound event retry or replay from the frontend, which retries downstream handling for that inbound event.
- Users can trigger webhook subscription scoped retry from the frontend, which retries only that subscription path.
- Manual actions show loading, success, and error states.
- The dashboard polls for updated delivery status every 10 seconds while visible.
- User admin settings allow the signed-in user to change password.
- Signing out returns the user to the login flow.
- Frontend typecheck and build pass.

## Open Questions

- None currently.

## Implementation Notes

- Frontend app remains in `frontend/`.
- Backend URL remains configured by `NEXT_PUBLIC_BACKEND_URL`.
- Better Auth remains the frontend authentication mechanism.
- The homepage should be the authenticated dashboard, not a marketing page.
- Keep the first dashboard practical and inspectable rather than visually elaborate.
- Dashboard polling interval: 10 seconds.
- Event-level retry or replay retries all downstream handling for the selected inbound event.
- Subscription-level retry retries only the selected webhook subscription path.
- Backend edit endpoints should not allow editing GUIDs or generated ids.

## Future Follow-Ups

- Add richer filtering and search.
- Add pagination for high-volume inbound events and deliveries.
- Add event-driven updates for delivery status.
- Add charts for event volume and delivery success rate.
- Add organization/team admin if the product grows beyond single-user ownership.
