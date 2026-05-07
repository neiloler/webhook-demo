# Frontend

Next.js frontend for the webhook demo.

## Local Setup

```sh
npm install
cp frontend/.env.example frontend/.env
npm run dev:frontend
```

The frontend runs on `http://localhost:3000` by default and calls the backend at `http://localhost:4000`.

Start the backend separately when testing authentication and the protected sanity endpoint:

```sh
npm run auth:migrate
npm run dev:backend
```

## Useful Commands

- `npm run dev:frontend` starts the Next.js dev server.
- `npm run build:frontend` builds the app.
- `npm run typecheck:frontend` checks TypeScript.

## Environment

- `NEXT_PUBLIC_BACKEND_URL` sets the browser-visible backend origin. For local development, use `http://localhost:4000`.
