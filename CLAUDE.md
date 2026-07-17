# CLAUDE.md

This file gives Claude Code the operating context for the Alpha CMS repo. Read it before making changes.

## What this project is

Alpha CMS is a multi-tenant Next.js 15 (App Router) content/portfolio management system. A single deployment serves multiple "portfolios" (tenants), each with its own blogs, case studies, projects, testimonials, leads, subscribers, and SMTP config. Auth is JWT-based (via `jose`) with role-based access control (`admin` / `editor` / `viewer`).

Full architectural rules live in [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) — **that document is strict and mandatory**, not a suggestion. This file points to it and adds working conventions; it does not repeat it.

## Stack

- Next.js 15 / React 19, App Router (`src/app`)
- MongoDB via Mongoose (`src/lib/db`)
- Zod 4 for schema validation (`src/schemas/cms.ts` → re-exported types in `src/types/cms.ts`)
- TanStack Query for client data fetching (`useCmsQuery`, mutations)
- Radix UI + Tailwind, "Brutalism+" design system (see below)
- BullMQ + Redis for newsletter/queue jobs (`src/lib/queues`, `src/workers`)
- Vitest for tests

## Before writing code

1. Read [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) sections relevant to what you're touching (API route, UI component, auth, SMTP, cascade deletes).
2. Check `src/schemas/cms.ts` and `src/types/cms.ts` first — every data model has a Zod schema there; don't invent parallel types.
3. Check `src/lib/api-utils.ts` (`apiHandler`), `src/lib/db/portfolio-utils.ts` (`scopeQuery`), and `src/lib/db` (`DbUtils`) before writing a new API route — these are mandatory wrappers, not optional helpers.
4. For UI, check `src/components/ui` for an existing primitive before adding a new one.

## Golden path for new content collections

Follow DEVELOPMENT_GUIDE.md §3 exactly:

- Backend: `apiHandler` wrapper → `DbUtils` for CRUD → `scopeQuery()` for tenant isolation.
- Frontend: `useCmsQuery` for reads, `useMutation` for writes, `buildQueryString()` for URLs — never hand-roll `URLSearchParams` or raw `fetch`/`axios`.

## Hard rules (do not violate)

- No `any` — use `unknown` or a real interface in `src/types/cms.ts`.
- Zod 4 syntax only (`z.email()`, `z.enum()`), never the deprecated forms.
- Never nest `<a>`/`Link` inside `<button>`/`Button` — use `asChild`.
- Destructive actions go through `BrutalConfirm`.
- No local CSS files — Tailwind utilities / global variables only.
- No manual `toast()` calls for server mutations — the `QueryProvider` `meta` handles it.
- Route Handlers use `await cookies()` from `next/headers`, never `req.cookies`.
- SMTP passwords go through `encrypt()` (`src/lib/encryption.ts`) — never stored raw.

## Commands

```bash
npm run dev          # dev server on :3001
npm run build
npm run lint
npm run format        # prettier — run before committing
npm test               # vitest run
npm run test:watch
npm run db-setup       # scripts/db-setup.js
```

## Working conventions

- Run `npm run format` and `npm run lint` before considering a change done.
- Prefer editing existing files (schemas, API routes, components) over creating parallel ones.
- When touching cascade-delete behavior (categories, portfolios), re-check DEVELOPMENT_GUIDE.md §7 — portfolio deletion is destructive and irreversible; confirm with the user before implementing or triggering it.
- Confirm with the user before any action affecting shared/production state (migrations, deploys, force-push, deleting data).

## Related docs

- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) — architectural rules (source of truth, strict enforcement)
- [DESIGN.md](DESIGN.md) — visual/design system reference (Brutalism+)
- [AGENTS.md](AGENTS.md) — agent-facing task conventions for this repo
