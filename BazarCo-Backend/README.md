# BazarCo Backend

TypeScript + Express.js API with a clear structure and health endpoint.

## Setup

```bash
npm install
cp .env.example .env   # optional: edit .env for PORT etc.
```

## Scripts

| Script        | Description                    |
|---------------|--------------------------------|
| `npm run dev` | Start dev server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run production build (`node dist/server.js`) |
| `npm run lint` | Run ESLint on `src/` |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run typecheck` | Type-check without emitting |
| `npm run clean` | Remove `dist/` |

## Health API

- **GET** `/health` — Returns `{ status, timestamp, uptime, environment }` for liveness/readiness.

## Project structure

```
src/
  config/     # env and app config
  controllers/# request handlers
  routes/     # route definitions
  app.ts      # Express app factory
  server.ts   # entry (listen)
```

## Environment

- `PORT` — Server port (default `3000`).
- `NODE_ENV` — `development` | `production` | `test`.
