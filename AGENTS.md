# Webhook Demo Build Rules

These rules apply across the repository unless a narrower `AGENTS.md` file is added in a subdirectory.

## Core Principles

- Build with current web platform standards first: native `fetch`, `URL`, `Request`, `Response`, `Headers`, `FormData`, `AbortController`, modern CSS, and semantic HTML before adding abstractions.
- Use TypeScript intentionally. Prefer explicit domain types, discriminated unions, narrow function inputs, and safe handling of `unknown`.
- Keep behavior close to where it is used until repetition or complexity proves an abstraction is worth it.
- Favor readable, direct code over cleverness. A future reader should be able to follow the happy path quickly.
- Keep changes scoped to the requested behavior and the modules that own it.

## JavaScript And TypeScript Style

- Use ES6+ syntax throughout: `const` and `let`, template literals, destructuring, optional chaining, nullish coalescing, async/await, and named imports.
- Prefer lambda function format with arrow functions assigned to `const`.
- Use named exports. Do not introduce default exports except where a framework contract requires one, such as Next.js `app/page.tsx` and `app/layout.tsx`.
- Do not create barrel files such as `index.ts` files whose main purpose is to re-export other modules.
- Avoid namespace-style utility modules. Export focused functions, constants, and types from the file that owns them.
- Prefer `type` aliases for data shapes and function contracts. Use `interface` only when declaration merging or an external API shape makes it useful.
- Use `import type` for type-only imports.
- Avoid `any`. If the shape is not known yet, use `unknown` and narrow it before use.
- Prefer early returns for invalid or terminal states.
- Keep comments rare and useful. Add them only when intent, constraints, or non-obvious tradeoffs are not clear from the code.

## Module Boundaries

- Import from concrete module paths, not barrel files.
- Keep frontend-only code inside `frontend/` and backend-only code inside `backend/`.
- Keep server secrets and privileged behavior out of client components and shared browser code.
- Use named exports for shared helpers so imports show exactly what a module consumes.
- Do not add cross-package coupling unless the shared contract is explicit and stable.

## Backend Rules

- Keep the backend ESM-compatible and Node 20+ compatible.
- Prefer Web API-compatible primitives when integrating with auth, webhooks, and external services.
- Keep Fastify route handlers small. Move parsing, validation, and domain behavior into named helpers when route code grows.
- Return structured JSON errors with stable `code` values for expected failures.
- Log server-side errors with useful context, but never log secrets, tokens, passwords, or complete auth payloads.
- Read configuration through the existing config module instead of accessing environment variables throughout the codebase.

## Frontend Rules

- Build accessible, semantic UI first. Use buttons for actions, anchors for navigation, labels for inputs, and clear focus states.
- Prefer server components by default in Next.js. Add `"use client"` only when a component needs browser APIs, state, effects, or client hooks.
- Keep client components focused and small. Extract named components or helpers when a file becomes hard to scan.
- Use forms and native browser behavior where they fit before adding custom state machines.
- Keep UI copy direct and product-specific.
- Do not place secrets or server-only configuration in `NEXT_PUBLIC_*` variables.

## Dependencies

- Prefer platform APIs and existing dependencies before adding new packages.
- Add a dependency only when it clearly reduces risk, complexity, or maintenance burden.
- Use proven libraries for established hard problems such as auth, parsing, validation, date/time handling, and protocol integrations.
- Keep dependency usage narrow and isolated so future replacement is possible.

## Verification

- Run the smallest meaningful check before handing off changes.
- Use these scripts when relevant:
  - `npm run typecheck:backend`
  - `npm run typecheck:frontend`
  - `npm run build:backend`
  - `npm run build:frontend`
- For user-facing frontend changes, run the app and verify the actual UI in a browser-sized viewport.
