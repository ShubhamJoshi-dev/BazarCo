# BazarCo

Full-stack app: Next.js frontend and Express (TypeScript) backend with MongoDB.

## Repo structure

| Folder              | Stack                    | Description        |
|---------------------|--------------------------|--------------------|
| `BazarCo-Backend`   | Node, Express, TypeScript, MongoDB (Mongoose) | REST API, health check, Atlas or local DB |
| `BazarCo-Frontend`  | Next.js 16, React 19, Tailwind, Framer Motion  | Coming Soon page, backend health widget  |

## Quick start

**Backend**

```bash
cd BazarCo-Backend
npm install
cp .env.example .env
npm run dev
```

**Frontend**

```bash
cd BazarCo-Frontend
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_URL` in the frontend `.env.local` to the backend URL (e.g. `http://localhost:3000`).

## Deployment (monorepo)

Create two services and set **Root Directory** so each service uses its own folder and only deploys when that folder changes.

| Service  | Root Directory   | Build Command           | Start Command   |
|----------|------------------|-------------------------|-----------------|
| Backend  | `BazarCo-Backend`  | `npm ci && npm run build` | `npm run start` |
| Frontend | `BazarCo-Frontend` | `npm ci && npm run build` | `npm run start` |

**Backend: run TypeScript directly (no build)**  
Use **Build Command** `npm ci` and **Start Command** `npm run start:ts`. This runs `tsx src/server.ts` so you skip the `tsc` step and avoid type-definition issues on Render. `tsx` is in dependencies so it installs in production.

- **Backend:** Add env vars (e.g. `PORT`, `BASE_URL`, `MONGO_URI_ATLAS`, `CLUSTER_MONGO_ENABLED`). Render sets `PORT` automatically.
- **Frontend:** Set `NEXT_PUBLIC_API_URL` to your backend URL (e.g. `https://your-backend.onrender.com`).

## CI

GitHub Actions runs on push and pull requests:

- **Backend:** `npm ci`, `npm run lint`, `npm run build`, `npm audit`
- **Frontend:** `npm ci`, `npm run lint`, `npm run build`, `npm audit`

See [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Docs

- [BazarCo-Backend/README.md](BazarCo-Backend/README.md) — API, env, scripts
- [BazarCo-Frontend/README.md](BazarCo-Frontend/README.md) — app structure, theme, scripts
