# BazarCo Frontend

Next.js app: Coming Soon page and backend health check (red/blue/white/black theme).

## Setup

```bash
npm install
cp .env.example .env.local
```

Set `NEXT_PUBLIC_API_URL` to the backend base URL (e.g. `http://localhost:3000`).

## Scripts

| Script           | Description            |
|------------------|------------------------|
| `npm run dev`    | Development server     |
| `npm run build`  | Production build       |
| `npm run start`  | Run production build  |
| `npm run lint`   | ESLint                 |

## Structure

- `src/app` — App Router (layout, page)
- `src/components` — UI (ComingSoonHero, BackendHealthButton)
- `src/config` — env / backend URL
- `src/hooks` — e.g. useHealthCheck
- `src/lib` — API client (fetchHealth)
- `src/types` — TypeScript types

## Theme

Red, blue, white, black. CSS variables in `globals.css`; animations via Framer Motion and CSS keyframes.
