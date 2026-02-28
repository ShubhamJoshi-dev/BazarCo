# BazarCo Frontend

Next.js app with Coming Soon page and backend health check.

## Setup

```bash
npm install
cp .env.example .env.local
```

Set `NEXT_PUBLIC_API_URL` to your backend URL (default `http://localhost:3000`).

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Run production server
- `npm run lint` - ESLint

## Structure

- `src/app` - App Router routes and layout
- `src/components` - UI components
- `src/hooks` - React hooks (e.g. useHealthCheck)
- `src/lib` - API client and utilities
- `src/types` - TypeScript types

## Theme

Red, blue, white, black. CSS variables in `globals.css`; animations via Framer Motion and CSS keyframes.
