# Backend

Fastify backend service for the webhook demo.

## Local Setup

```sh
npm install
cp backend/.env.example backend/.env
npm run auth:migrate
npm run dev:backend
```

The backend runs on `http://localhost:4000` by default.

## Useful Endpoints

- `GET /health` checks that the Fastify service is running.
- `GET /api/auth/*` and `POST /api/auth/*` are owned by Better Auth.
- `GET /api/me` is protected and returns the current Better Auth session.

Unauthenticated requests to `GET /api/me` return `401`.
