# Webhook Demo

A local demo app for creating public ingest endpoints, receiving inbound events,
and delivering them to webhook subscriptions.

The project is split into three npm workspaces:

- `backend`: Fastify API, Better Auth, and local SQLite storage.
- `frontend`: Next.js app for using the demo in a browser.
- `test-harness`: Optional CLI tools for exercising webhook flows locally.

## Requirements

- Node.js 20 or newer
- npm

## Getting Started

Run all commands from the repository root. The root `npm install` installs
dependencies for `backend`, `frontend`, and `test-harness`.

### 1. Backend Setup

Set up the backend environment and local Better Auth SQLite schema:

```sh
npm install
cp backend/.env.example backend/.env
npm run auth:migrate
```

Start the backend:

```sh
npm run dev:backend
```

The backend runs at `http://localhost:4000`. Check it with:

```sh
curl http://localhost:4000/health
```

### 2. Frontend Setup

Set up the frontend environment:

```sh
npm install
cp frontend/.env.example frontend/.env
```

Start the frontend:

```sh
npm run dev:frontend
```

The frontend runs at `http://localhost:3000` and expects the backend at
`http://localhost:4000`. Keep the backend running in a separate terminal while
using the app.

### 3. Test-harness Setup

The test harness creates local test data, starts webhook receivers, sends events,
and checks delivery attempts. Set up the backend and keep it running first:

```sh
npm install
cp backend/.env.example backend/.env
npm run auth:migrate
npm run dev:backend
```

Then run the basic local scenario from another terminal:

```sh
npm run dev:harness -- scenario basic
```

Useful harness variants:

```sh
npm run dev:harness -- scenario basic --count 3 --interval-ms 250
npm run dev:harness -- scenario basic --no-slow --no-dead
npm run dev:harness -- scenario basic --backend-url http://localhost:4000
npm run dev:harness -- scenario basic --auth-origin http://localhost:3000
```

## Common Commands

```sh
npm run dev:backend
npm run dev:frontend
npm run dev:harness -- scenario basic

npm run typecheck:backend
npm run typecheck:frontend
npm run typecheck:harness

npm run build:backend
npm run build:frontend
npm run build:harness

npm run start:backend
npm run start:frontend
npm run start:harness -- scenario basic
```

## Environment Files

Backend settings live in `backend/.env`:

```sh
NODE_ENV=development
PORT=4000
HOST=127.0.0.1
CLIENT_ORIGIN=http://localhost:3000
BETTER_AUTH_URL=http://localhost:4000
BETTER_AUTH_SECRET=change-me-in-local-env
DATABASE_PATH=./data/auth.sqlite
```

Frontend settings live in `frontend/.env`:

```sh
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

The example environment files are ready for local development. Before sharing or
deploying this project anywhere else, replace `BETTER_AUTH_SECRET` in
`backend/.env` with a real secret value.

## Reset Local Data

Local data is stored in the SQLite file configured by `DATABASE_PATH`. With the
default settings, that file is `backend/data/auth.sqlite`.

To reset local data, stop the backend, remove the database file, and run the
migration again:

```sh
rm backend/data/auth.sqlite
npm run auth:migrate
```

Then restart the backend.

## More Details

- Backend API notes: `backend/README.md`
- Frontend notes: `frontend/README.md`
- Test harness notes: `test-harness/README.md`

## AI Conversation Archive

The Codex conversations used while building this project are exported as
Markdown files in [docs/AI-conversations](./docs/AI-conversations). In
chronological order:

- [Plan webhook service epics](./docs/AI-conversations/01-plan-webhook-service-epics.md): Outlined initial webhook service architecture.
- [Draft webhook epics (and Epic 1, whoops)](./docs/AI-conversations/02-draft-webhook-epics-and-epic-1-whoops.md): Created first backend and frontend epics.
- [Epic 2 - Basic Frontend](./docs/AI-conversations/03-epic-2-basic-frontend.md): Built initial Next.js frontend shell.
- [Add coding standards rules](./docs/AI-conversations/04-add-coding-standards-rules.md): Added repository-wide coding standards guidance.
- [Add shadcn/ui setup to app](./docs/AI-conversations/05-add-shadcn-ui-setup-to-app.md): Integrated shadcn/ui frontend component setup.
- [Epic 3 - Build webhook backend plan](./docs/AI-conversations/06-epic-3-build-webhook-backend-plan.md): Implemented webhook backend routes and storage.
- [Epic 5 - Revamp the mental model and all that supports](./docs/AI-conversations/07-epic-5-revamp-the-mental-model-and-all-that-supports.md): Refined endpoint and delivery mental model.
- [Implement Epic 4](./docs/AI-conversations/08-implement-epic-4.md): Built dashboard and user administration flows.
- [(Effective) Epic 6 - Create webhook test harness](./docs/AI-conversations/09-effective-epic-6-create-webhook-test-harness.md): Created local webhook test harness tooling.
- [Update main README setup guide](./docs/AI-conversations/10-update-main-readme-setup-guide.md): Expanded root project setup instructions.
- [Export AI conversations to docs](./docs/AI-conversations/11-export-ai-conversations-to-docs.md): Exported Codex conversations for review.
