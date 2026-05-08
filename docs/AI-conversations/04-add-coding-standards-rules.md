# Add coding standards rules

## User

Let's build out a rules file for how we'll be building in our app and code.

Let's use the latest web standards, ES6+, lambda function format, do not use default exports and barrel files.


## Assistant

I’ll take a quick look at the repo shape first so the rules land in the right place and match whatever conventions already exist. After that I’ll add a focused rules file rather than guessing at a framework-specific setup.

## Assistant

This is a small TypeScript workspace with separate backend and frontend packages, and there isn’t an existing agent/rules file to extend. I’m going to add one at the repo root so it applies across both apps.

## Assistant

One wrinkle I noticed: the frontend is Next, and files like `app/page.tsx` and `app/layout.tsx` are framework contracts that normally require default exports. I’ll encode the rule as “named exports everywhere, except framework-mandated entry files,” which keeps the intent strong without breaking Next.

## Assistant

I’ve got enough context now. I’m adding `AGENTS.md` with repo-wide engineering rules plus small project-specific notes for the Fastify backend and Next frontend.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
A /Users/neiloler/dev/webhook-demo/AGENTS.md
```

## Assistant

The rules file is in place. I’m doing a quick readback plus git status now, mainly to catch formatting oddities before I call it done.

## Assistant (final)

Added the repo-wide build rules at [AGENTS.md](/Users/neiloler/dev/webhook-demo/AGENTS.md:1).

It captures the standards you asked for: modern web APIs, ES6+, arrow-function style, named exports, no barrel files, plus project-specific notes for the Fastify backend and Next frontend. I also included a small Next.js exception for default exports where the framework requires them, like `app/page.tsx` and `app/layout.tsx`.

No tests were run since this was documentation/rules-only.

## User

Let's evaluate our code and tell me (WITHOUT CHANGING ANYTHING RIGHT NOW) the things that need to be done to keep our rules.


## Assistant

I’ll audit the current code against the new `AGENTS.md` rules only, without editing files. I’m going to scan the source for export style, function declarations, framework exceptions, env/config usage, and any obvious boundary issues.

## Assistant

The first pass found no barrel files and no `any`, which is nice and clean. The main mismatches are looking like function declaration style and a few default exports that need separating into framework-required versus avoidable.

## Assistant

I’m checking the UI/CSS side too, because the rules include accessibility, semantic UI, and frontend ergonomics. So far the form markup looks mostly aligned: labels, native inputs, buttons, and clear status regions are present.

## Assistant (final)

I audited without changing anything.

**Needs Work**
1. Convert function declarations to arrow-function `const`s to match “lambda function format.”
   Affected spots:
   [backend/src/config.ts](/Users/neiloler/dev/webhook-demo/backend/src/config.ts:11) `requiredSecret`
   [backend/src/config.ts](/Users/neiloler/dev/webhook-demo/backend/src/config.ts:25) `parseTrustedOrigins`
   [backend/src/server.ts](/Users/neiloler/dev/webhook-demo/backend/src/server.ts:14) `getSession`
   [backend/src/server.ts](/Users/neiloler/dev/webhook-demo/backend/src/server.ts:20) `requireSession`
   [backend/src/server.ts](/Users/neiloler/dev/webhook-demo/backend/src/server.ts:34) `toBetterAuthRequest`
   [backend/src/server.ts](/Users/neiloler/dev/webhook-demo/backend/src/server.ts:48) `sendBetterAuthResponse`
   [backend/src/server.ts](/Users/neiloler/dev/webhook-demo/backend/src/server.ts:56) `buildServer`
   [backend/src/server.ts](/Users/neiloler/dev/webhook-demo/backend/src/server.ts:105) `startServer`
   [frontend/app/page.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/page.tsx:39) `statusClass`
   [frontend/app/page.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/page.tsx:55) `formatDetails`
   [frontend/app/page.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/page.tsx:77) `handleAuthSubmit`
   [frontend/app/page.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/page.tsx:115) `handleSignOut`
   [frontend/app/page.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/page.tsx:137) `checkBackend`

2. Keep default exports only where framework-required, but use arrow components where possible.
   These default exports are acceptable because of Next.js conventions:
   [frontend/app/page.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/page.tsx:63)
   [frontend/app/layout.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/layout.tsx:9)
   [frontend/next.config.ts](/Users/neiloler/dev/webhook-demo/frontend/next.config.ts:5)

   Still, `Home` and `RootLayout` could be rewritten as `const Home = (...) => ...` and `const RootLayout = (...) => ...`, then default-exported for Next.

3. Tighten response parsing in [frontend/app/page.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/page.tsx:155).
   `body as MeResponse` is a type assertion from unknown JSON. To better follow “safe handling of `unknown`,” add a small type guard before treating the response as authenticated data.

4. Validate numeric config in [backend/src/config.ts](/Users/neiloler/dev/webhook-demo/backend/src/config.ts:43).
   `Number(process.env.PORT ?? DEFAULT_PORT)` can produce `NaN`. A small parser would better match the rules around explicit domain handling and safe inputs.

**Already Aligned**
No barrel files found. No `any` found. Type-only imports are already used where visible. Backend env access is centralized in `backend/src/config.ts`, which matches the config rule. UI markup is mostly semantic and accessible: labels, native inputs, buttons, and focus states are present.

I did not run typechecks since this was a read-only audit.

## User

Let's update those instances, make sure we're keeping our rules we just added.


## Assistant

I’ll make the style changes and the two safety fixes now: arrow-function `const`s, safer frontend response narrowing, and backend port parsing. I’ll keep the Next-required default exports, just expressed through named `const` components before the export.

## Assistant

I’m about to edit the implementation files. The changes are mechanical where possible, with the only behavioral tightening being invalid `PORT` now fails clearly and unexpected `/api/me` JSON no longer gets trusted by assertion.

## Patch

Success: true

Output:
```text
Success. Updated the following files:
M /Users/neiloler/dev/webhook-demo/backend/src/config.ts
M /Users/neiloler/dev/webhook-demo/backend/src/server.ts
M /Users/neiloler/dev/webhook-demo/frontend/app/layout.tsx
M /Users/neiloler/dev/webhook-demo/frontend/app/page.tsx
```

## Assistant

The edits are in. I’m running the repo-rule scan again first, then I’ll typecheck both packages so we catch anything the mechanical conversion shook loose.

## Assistant

Both typechecks passed. I’m doing one final diff/status pass now so the summary is precise and we can confirm the rule scan stayed clean.

## Assistant (final)

Updated the code to match the new rules.

Changed function declarations to arrow-function `const`s in:
[backend/src/config.ts](/Users/neiloler/dev/webhook-demo/backend/src/config.ts:11), [backend/src/server.ts](/Users/neiloler/dev/webhook-demo/backend/src/server.ts:14), [frontend/app/layout.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/layout.tsx:8), and [frontend/app/page.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/page.tsx:39).

Also tightened the two safety items:
- [backend/src/config.ts](/Users/neiloler/dev/webhook-demo/backend/src/config.ts:34) now validates `PORT` instead of allowing `NaN`.
- [frontend/app/page.tsx](/Users/neiloler/dev/webhook-demo/frontend/app/page.tsx:63) now narrows `/api/me` JSON with a type guard instead of `body as MeResponse`.

Kept the Next-required default exports, but moved them to `const` components followed by `export default`.

Verification passed:
- `npm run typecheck:backend`
- `npm run typecheck:frontend`
- Rule scan found no function declarations, `any`, interfaces, barrel exports, or `index` barrel imports in `backend`/`frontend`.
