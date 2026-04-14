# Punch List Tracker

Construction **punch list** app: defects are created, assigned, moved through a fixed workflow, and summarized on a dashboard.

**Live demo:** _Add your Vercel URL after deploy._

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS  
- **Prisma** + **PostgreSQL** (Supabase in production)  
- **tRPC** + **Zod** + **SuperJSON**  
- **Supabase Storage** for optional punch-item photos (server upload with service role)

## Local setup

1. **Node.js 20+** and **npm** (or pnpm).

2. **Database** — either:
   - **Docker:** from this folder, `docker compose up -d` then use the URL in `.env.example` (port **5433**), or  
   - **Supabase:** create a project and paste the Postgres connection string as `DATABASE_URL` (use the **pooled** string for serverless if you deploy).

3. Copy env and migrate:

   ```bash
   cp .env.example .env
   # Edit DATABASE_URL if needed
   npm install
   npm run db:deploy
   ```

   For local development with new schema changes you can use `npm run db:migrate` instead of `db:deploy`.

4. **Optional seed data**

   ```bash
   npm run db:seed
   ```

5. **Supabase Storage (photos)** — optional for local dev:
   - Create a bucket named `punch-photos`.
   - Set **public read** for the bucket (demo) or use signed URLs in a production setup.
   - Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.
   - Without these, the app runs; photo upload returns a clear configuration error.

6. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Business rules (workflow)

Implemented in `src/lib/punch-item-workflow.ts` and enforced in `punchItem.transitionStatus` (not only in the UI).

- **Statuses:** `open`, `in_progress`, `complete`.
- **Allowed transitions:**
  - `open` → `in_progress`
  - `in_progress` → `complete`
  - `complete` → `open` (reopen)
- **No skipping:** e.g. `open` → `complete` is rejected.
- **Assignment gate:** transition to `in_progress` requires a non-empty `assignedTo` (someone must own the work before it starts).
- **Project close-out:** when every punch item reaches `complete`, the project can be **archived**. This mirrors the real-world constraint: a punch list is the last step before a project closes — you can't close until every defect is resolved.

Status changes are **not** applied through arbitrary `update` fields; use **Change status** (or the `transitionStatus` API) so rules stay centralized.

## Deploy (Vercel + Supabase)

1. Push this repo to **GitHub** (public for the assignment).
2. **Vercel:** import the repo, set the same env vars as production (especially `DATABASE_URL`, `SUPABASE_*`).
3. Run migrations against production:

   ```bash
   DATABASE_URL="your-prod-url" npx prisma migrate deploy
   ```

4. Smoke test: create project, add items, transition statuses, open dashboard, optional photo upload.

## Scripts

| Script            | Purpose                |
|-------------------|------------------------|
| `npm run dev`     | Dev server             |
| `npm run build`   | `prisma generate` + production build |
| `npm run db:deploy` | Apply migrations (CI/prod) |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:seed` | Seed demo project + items |
| `npm run db:studio` | Prisma Studio        |

## How I’d enhance

- **Supabase Auth** + RLS so each tenant only sees their projects and the API is locked down per-user.
- **Audit log** (`updatedAt`, who changed status, optional comment on reopen) — critical for construction accountability.
- **Notifications** (email/push) when items move to `in_progress` or `complete`.
- **Offline-first mobile** for field crews (sync + photo capture via React Native/Expo).
- **E2E tests** (Playwright) for the main happy path.
- **Batch operations** — mark multiple items complete at once during a walkthrough.
- **PDF export** of the punch list for GC handoff (common in the industry).

## AI usage

This project was scaffolded and implemented with **Cursor / Claude** (Next.js, Prisma, tRPC, UI). One concrete correction: the first **Prisma 7** init used a schema shape that moved `DATABASE_URL` out of `schema.prisma`; for speed and compatibility with standard tutorials, the stack was pinned to **Prisma 5** with a classic `datasource` URL in `schema.prisma`, which keeps `prisma migrate` and `PrismaClient` straightforward for a take-home.
