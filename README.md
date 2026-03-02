# BazarCo

**BazarCo** is a full-stack e-commerce marketplace where **buyers** can browse and buy products and **sellers** can list and manage their catalog, with dashboards, search, cart, orders, and seller analytics.

---

## Overview

| | |
|--|--|
| **Backend** | Node.js, Express, TypeScript, MongoDB (Mongoose), optional Algolia, Cloudinary, Shopify, Nodemailer |
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Framer Motion, next-intl, next-themes |
| **Auth** | JWT-based login/signup; roles: **buyer** and **seller** |

- **Buyers**: Browse products (with full-text search), view product details, add to cart, manage favourites, place orders, and update profile.
- **Sellers**: Manage products (CRUD, archive), view a **seller report** (products, orders, charts, rating), and control catalog with categories and tags.
- **Search**: Browse uses MongoDB by default; when the user searches, **Algolia** is used (with fallback to MongoDB if Algolia returns no hits). Full-text search on product **name** and **description**.
- **Localization**: **Nepali** and **Australian English** (next-intl); theme switcher for **dark/light/system** (next-themes).

---

## Repo structure

| Folder | Description |
|--------|-------------|
| **BazarCo-Backend** | REST API: auth, products, browse/search, cart, orders, favourites, categories, tags, seller report, reviews, likes. Optional: Algolia, Cloudinary, Shopify, email. |
| **BazarCo-Frontend** | Next.js app: landing, login/signup, dashboard (buyer/seller), browse, product detail, cart, favourites, profile, seller report. i18n + theme. |

---

## Features

### For everyone
- **Auth**: Sign up, login, forgot/reset password, JWT.
- **Profile**: Update name; view account.
- **Theme**: Dark, light, or system.
- **Language**: English (AU) or नेपाली.

### Buyers
- **Browse**: List products with category/tag filters; full-text search (Algolia + MongoDB fallback).
- **Product detail**: Name, description, price, image, category, tags, reviews, like count, add to cart.
- **Cart**: Add/remove items, change quantity; email notification on add-to-cart (if mail configured).
- **Favourites**: Add/remove favourite products.
- **Orders**: View orders (in progress / completed).

### Sellers
- **Products**: Create, edit, delete, archive/unarchive; upload image (Cloudinary optional).
- **Seller report**: Product list, products sold, orders in progress, pie/bar charts, seller rating (starts at 0).
- **Catalog**: Categories and tags for products.

### Backend integrations (optional)
- **Algolia**: Search index with `searchableAttributes` (name, description) and faceting (status, category, tags). Index settings applied at startup.
- **Cloudinary**: Product image uploads.
- **Shopify**: Optional product sync.
- **Nodemailer**: Notifications (e.g. add-to-cart email).

---

## Quick start

### Prerequisites
- **Node.js** ≥ 18  
- **MongoDB** (local or Atlas)

### Backend

```bash
cd BazarCo-Backend
npm install
cp .env.example .env
```

Edit `.env`: set `PORT`, `BASE_URL`, `MONGO_URI` (or Atlas vars). Optionally set Algolia, Cloudinary, JWT, mail, etc.

```bash
# Optional: start MongoDB with Docker
npm run docker:up

npm run dev
```

API runs at `http://localhost:3000` (or your `PORT`). Health: `GET /health`. API docs: `GET /api-docs` (Swagger).

### Frontend

```bash
cd BazarCo-Frontend
npm install
cp .env.example .env.local
```

Set `NEXT_PUBLIC_API_URL` to the backend URL (e.g. `http://localhost:3000`).

```bash
npm run dev
```

App runs at `http://localhost:3001` (or Next.js default).

### Seed data (optional)

```bash
cd BazarCo-Backend
npm run seed:dev      # dev users
npm run seed:products # sample products (and Algolia if configured)
```

---

## API overview

| Area | Routes (prefix) | Notes |
|------|------------------|--------|
| Auth | `/auth` | Login, signup, refresh, forgot/reset password |
| Health | `/health` | Liveness/readiness |
| Products | `/products` | `GET /browse` (search + filters), `GET /`, `GET /:id`, POST/PATCH/DELETE, archive, reviews, like |
| Cart | `/cart` | GET, POST, PATCH `/:productId`, DELETE `/:productId` |
| Orders | `/orders` | List, create, update |
| Favourites | `/favourites` | Add, remove, check |
| Categories | `/categories` | List |
| Tags | `/tags` | List |
| Seller | `/seller/report` | Report data (products, orders, charts, rating) |
| Notify | `/notify` | Email signup (e.g. coming soon) |

All except health and public auth endpoints use **JWT** via `Authorization: Bearer <token>`.

---

## Environment

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `3000`) |
| `BASE_URL` | Public API base URL |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `MONGO_URI` | Local MongoDB URI |
| `CLUSTER_MONGO_ENABLED` | Use Atlas when `true` |
| `MONGO_URI_ATLAS` or `CLUSTER_MONGO_URI` | Atlas connection string |
| `JWT_SECRET` | Secret for JWT (required in production) |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) |
| `FRONTEND_URL` | Frontend origin (CORS, redirects) |
| `ALGOLIA_APP_ID`, `ALGOLIA_WRITE_API_KEY`, `ALGOLIA_INDEX_NAME` | Algolia search (optional) |
| `CLOUDINARY_*` | Image uploads (optional) |
| `SHOPIFY_*` | Shopify sync (optional) |
| `APP_MAIL`, `APP_PW` | Nodemailer (optional, e.g. add-to-cart email) |

### Frontend (`.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL (no trailing slash) |

---

## Deployment (monorepo)

Use two services (e.g. Render, Vercel) and set **Root Directory** so each app builds from its folder.

| Service | Root | Build | Start |
|---------|------|--------|--------|
| Backend | `BazarCo-Backend` | `npm ci && npm run build` | `npm run start` |
| Frontend | `BazarCo-Frontend` | `npm ci && npm run build` | `npm run start` |

**Backend without precompiling TypeScript:**  
Build: `npm ci`, Start: `npm run start:ts` (uses `tsx src/server.ts`).

Set env vars per service; point frontend `NEXT_PUBLIC_API_URL` at the deployed backend.

---

## CI

GitHub Actions (see `.github/workflows/ci.yml`):

- **Backend:** `npm ci`, lint, build, audit  
- **Frontend:** `npm ci`, lint, build, audit  

---

## Docs

- [BazarCo-Backend/README.md](BazarCo-Backend/README.md) — API details, scripts, structure  
- [BazarCo-Frontend/README.md](BazarCo-Frontend/README.md) — app structure, theme, scripts  

---

## License

MIT
