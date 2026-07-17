# AGENTS.md

Task conventions for any AI agent (Claude Code or otherwise) working in this repo. Read [CLAUDE.md](CLAUDE.md), [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md), and [DESIGN.md](DESIGN.md) first — this file is about _how to execute tasks_, those are about _what the code must look like_.

## Repo map (orientation)

```
src/app/(admin)/*        Admin dashboard pages (blogs, case-studies, leads, users, ...)
src/app/api/*             Route Handlers, one folder per resource, [id] for single-item ops
src/app/(public pages)     login, forgot-password, reset-password, unsubscribe
src/components/ui          Radix/shadcn primitives (Button, BrutalConfirm, BrutalTable, ...)
src/components/cms         CMS-specific composite components
src/components/dashboard   Admin shell/layout
src/schemas/cms.ts          Zod schemas — single source of truth for data shape
src/types/cms.ts            Re-exported TS types — always import from here, not schemas/cms.ts
src/lib/api-utils.ts        apiHandler wrapper (error handling, DB connect, role gating)
src/lib/db/portfolio-utils.ts  scopeQuery() — multi-tenant isolation
src/lib/db/dbConnect.ts     Mongo connection
src/lib/auth.ts / auth-utils.ts  RBAC helpers (hasPermission, useAuth)
src/lib/newsletter-engine.ts   SMTP/newsletter sending, getTransporter()
src/lib/queues, src/workers  BullMQ job queues
src/hooks                   useCmsQuery and other client hooks
```

## Standard workflow for a new task

1. **Locate the model** in `src/schemas/cms.ts` / `src/types/cms.ts`. If the task needs a new collection, add the Zod schema there first, extending `BaseSchema`.
2. **Backend**: new/changed route in `src/app/api/<resource>/route.ts` (and `[id]/route.ts` for single-item ops), wrapped in `apiHandler`, using `DbUtils` + `scopeQuery()`.
3. **Frontend**: hook up via `useCmsQuery` / `useMutation`, build URLs with `buildQueryString()`.
4. **UI**: compose from `src/components/ui` primitives per [DESIGN.md](DESIGN.md) — don't hand-style new surfaces when `.brutal-card` / `BrutalTable` / etc. already cover the case.
5. **Validate**: `npm run lint`, `npm run format`, `npm test` before calling a task done.

## Testing

- Vitest config at root (`vitest.config.ts`); specs live under `src/__tests__`.
- Run a single file with `npx vitest run <path>`; use `npm run test:watch` while iterating.
- New API routes or lib utilities with non-trivial logic (auth checks, cascade deletes, SMTP fallback) should get a test in `src/__tests__`.

## Things that will get a change rejected

- Introducing `any`, raw `fetch`/`axios`, manual `URLSearchParams`, or a second rich-text/chart/editor library.
- Sharp-corner/`rounded-none`/thick-black-border styling — the actual system is the soft, glassy dark theme in [DESIGN.md](DESIGN.md), not literal brutalism.
- Skipping `scopeQuery()` on a content API — this is the multi-tenancy boundary; skipping it leaks data across portfolios.
- Deleting a portfolio without the user's explicit confirmation — it cascades and is irreversible (DEVELOPMENT_GUIDE.md §7).
- Storing SMTP credentials or secrets unencrypted.

## When a task is ambiguous

- If a requested UI treatment conflicts with the existing dark/glassy theme, flag it rather than silently reinterpreting either the request or the theme.
- If a new collection doesn't cleanly fit the `BaseSchema` / `scopeQuery()` pattern (e.g., a genuinely global, non-tenant-scoped resource), ask before deviating from the golden path.
- For anything touching production data, deploys, or destructive DB operations, confirm with the user before acting.
