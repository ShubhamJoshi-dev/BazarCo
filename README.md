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

## CI

GitHub Actions runs on push and pull requests:

- **Backend:** `npm ci`, `npm run lint`, `npm run build`, `npm audit`
- **Frontend:** `npm ci`, `npm run lint`, `npm run build`, `npm audit`

See [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Docs

- [BazarCo-Backend/README.md](BazarCo-Backend/README.md) — API, env, scripts
- [BazarCo-Frontend/README.md](BazarCo-Frontend/README.md) — app structure, theme, scripts
