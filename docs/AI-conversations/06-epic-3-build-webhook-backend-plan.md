# Epic 3 - Build webhook backend plan

## User

Let's build out the Epic 3 plan for backend Webhook functionality.


## Assistant

I’ll take a quick pass through the repo to find the existing planning docs and backend shape, then I’ll turn Epic 3 into something concrete in the same style.

## Assistant

There’s already a substantial Epic 3 doc in `docs/epics`, so I’m going to treat “build out” as implementing that backend slice unless the code tells me it’s intentionally only planning. Next I’m reading the current backend setup and package scripts so the new webhook domain lands cleanly.

## Assistant

I found Epic 3 is already written as a detailed backend implementation plan. I’m going to add a small SQLite domain layer plus Fastify routes, keeping auth/session checks in the existing backend and leaving delivery/retry for later exactly as the epic asks.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
A /Users/neiloler/dev/webhook-demo/backend/src/auth-session.ts
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
A /Users/neiloler/dev/webhook-demo/backend/src/database.ts
```

## Assistant

I’m moving the session guard into its own tiny module and adding a backend-owned SQLite initializer now. That gives the webhook routes a clean home without turning `server.ts` into a long route kitchen.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
A /Users/neiloler/dev/webhook-demo/backend/src/webhook-routes.ts
```

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/backend/src/server.ts
```

## Assistant

The main route surface is in place now. I’m going to compile it once before touching docs, because TypeScript will be the fastest way to catch any route generic or SQLite binding mismatches.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/backend/src/server.ts
```

## Assistant

Typecheck passes so far, and I noticed the body-size guard should surface as a client error instead of being flattened into a 500. I’ve tightened that error handler and I’m updating the backend README with practical curl shapes next.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/backend/README.md
```

## Assistant

The first verification pass caught exactly one TypeScript strictness issue: Fastify’s error handler parameter is coming through as `unknown` in this setup. I’m adding a narrow type annotation there and rerunning the checks.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/backend/src/server.ts
```

## Assistant

Both backend typecheck and build pass after the error-handler fix. I’m going to do a tiny in-process Fastify smoke check with `inject()` now: health, auth protection, and the unauthenticated event-ingestion rejection path.

## Assistant

The smoke check shows the new routes are mounted and the unauthenticated management path rejects correctly. I’m doing one more isolated temp-database check for the happy-path event ingestion, so we know an active registered event actually records an occurrence.

## Assistant (final)

Implemented the Epic 3 backend slice.

Added SQLite webhook-domain schema in [database.ts](/Users/neiloler/dev/webhook-demo/backend/src/database.ts), extracted the auth guard to [auth-session.ts](/Users/neiloler/dev/webhook-demo/backend/src/auth-session.ts), and wired the full route set in [webhook-routes.ts](/Users/neiloler/dev/webhook-demo/backend/src/webhook-routes.ts): registered webhook events, target URL registrations, unauthenticated event ingestion with 64 KB body limit and 100 req/sec in-memory rate limit, plus authenticated event inspection.

Updated [server.ts](/Users/neiloler/dev/webhook-demo/backend/src/server.ts) to initialize schema, register routes, and return structured client/server errors. Updated [README.md](/Users/neiloler/dev/webhook-demo/backend/README.md) with endpoint docs and curl examples.

Verification passed:
- `npm run typecheck:backend`
- `npm run build:backend`
- Fastify smoke checks: `/health` `200`, protected webhook list `401`, unknown ingestion `400`
- Temp DB happy-path ingestion: `POST /api/events` returned `201` and persisted the occurrence.
