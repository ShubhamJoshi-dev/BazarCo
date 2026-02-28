# BazarCo Backend

TypeScript + Express.js API with MongoDB (local or Atlas).

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`: set `PORT`, `BASE_URL`, and for Atlas set `CLUSTER_MONGO_ENABLED=true` and `MONGO_URI_ATLAS`.

## Scripts

| Script           | Description                          |
|------------------|--------------------------------------|
| `npm run dev`    | Dev server with hot reload           |
| `npm run build`  | Compile TypeScript to `dist/`        |
| `npm run start`  | Run production build                 |
| `npm run lint`   | ESLint on `src/`                     |
| `npm run lint:fix` | ESLint with auto-fix               |
| `npm run typecheck` | Type-check only                   |
| `npm run clean`  | Remove `dist/`                       |
| `npm run docker:up` | Start MongoDB (Docker)             |
| `npm run docker:down` | Stop MongoDB (Docker)            |

## API

- **GET** `/` — App name and version
- **GET** `/health` — `{ status, timestamp, uptime, environment, db }` (liveness/readiness)

## Structure

```
src/
  config/     env, DB connection
  controllers/
  interfaces/
  routes/
  app.ts
  server.ts
```

## Environment

| Variable               | Description                          |
|------------------------|--------------------------------------|
| `PORT`                 | Server port (default `3000`)         |
| `BASE_URL`             | Public base URL of the API           |
| `NODE_ENV`             | `development` \| `production` \| `test` |
| `MONGO_URI`            | Local MongoDB URI                    |
| `CLUSTER_MONGO_ENABLED`| Use Atlas when `true`                |
| `MONGO_URI_ATLAS`      | MongoDB Atlas connection string      |
