# Alpha CMS Development Guide

This document defines the **strict** architectural and design standards for the Alpha CMS. All modifications must adhere to these patterns to ensure consistency, performance, and maintainability.

## 1. Type Safety & Quality

- **Strict Typing**: Generic `any` is strictly prohibited. Use `unknown` or define specific interfaces in `src/types/cms.ts`.
- **Formatting**: Prettier is mandatory. Run `npm run format` before every commit to ensure workspace consistency.
- **Zod Schemas**: Every data model must have a Zod schema in `src/schemas/cms.ts`. Use the `BaseSchema.extend(BaseSchema.shape)` pattern to inherit core fields.
- **Zod 4 Standards (MANDATORY)**: Always use modern Zod 4 patterns.
  - **X** `z.string().email()` -> **✓** `z.email()`
  - **X** `z.nativeEnum(Enum)` -> **✓** `z.enum(Enum)`

## 2. UI & Design System (Brutalism+)

The UI must feel raw, high-contrast, and "industrial."

- **Radix Primitives**: Use Radix UI primitives (via Shadcn) for all complex logic and accessibility.
- **The `asChild` Rule**: For components like `Button`, always use the `asChild` prop when nesting interactive elements (like `Link`). **Never** nest an `<a>` inside a `<button>`.
- **Aesthetic Consistency**:
  - High-contrast borders: `border-2` or `border-4`.
  - Sharp corners: `rounded-none`.
  - Bold shadows: `shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`.
- **Safety Workflows**: All destructive actions (Delete) **MUST** use the `BrutalConfirm` component.

## 3. DRY Architecture (The Golden Path)

Follow this sequence when adding new content collections:

### Backend Logic

1. **Standard Handlers**: Wrap all API routes in `apiHandler` for unified error catching and DB management.
2. **Database Access**: Use the `DbUtils` helper for all CRUD operations to ensure standardized timestamps and safe `ObjectId` conversions.
3. **Scoping**: Always use `scopeQuery()` from `portfolio-utils.ts` to isolate data by portfolio.

### Frontend Integration

1. **Data Fetching**: Use `useCmsQuery` for all GET requests and `useMutation` for writes.
2. **Utilities**: Use `buildQueryString(filters)` for all URL construction. Never manually append parameters using `URLSearchParams`.

## 4. Authentication & Permissions (RBAC & Multi-Tenancy)

The Alpha CMS uses a robust Role-Based Access Control and Multi-Tenant Isolation system.

- **Client Side**: Use the `useAuth()` hook to access the current user. Use the `hasPermission(user, 'PERMISSION_NAME')` utility from `src/lib/auth.ts`.
- **Multi-Tenancy**: Users (except Admins) are restricted to their `assignedPortfolios`. The `scopeQuery()` utility automatically enforces this isolation across all content APIs.
- **Roles**:
  - `admin`: Global system control (All Portfolios).
  - `editor`: Can manage content in assigned portfolios.
  - `viewer`: Read-only access to assigned portfolios.
- **API Protection**: The `apiHandler` automatically blocks all non-GET requests for users with the `viewer` role.
- **Server Side**: Always use the `cookies()` helper from `next/headers` to access authentication tokens in Route Handlers.

## 5. Infrastructure & SMTP

- **Multi-Tenant SMTP**: Every portfolio can have its own dedicated SMTP configuration.
- **Dynamic Delivery**: Use `getTransporter(portfolio)` from `newsletter-engine.ts`. This utility automatically decrypts custom credentials and falls back to system defaults if needed.
- **Security**: Never store raw passwords. SMTP passwords must be encrypted using `encrypt()` from `src/lib/encryption.ts` before database insertion.

## 6. Prohibited Patterns (Strict Enforcement)

- **X** Do not use raw `axios` or `fetch`; use the centralized `api` client.
- **X** Do not use `req.cookies` in Route Handlers; use `await cookies()`.
- **X** Do not nest interactive elements (e.g., `Button` containing `Link` without `asChild`).
- **X** Do not create local CSS files; use Tailwind utility classes or global variables.
- **X** Do not manually call `toast()` for server-side mutations; let the `QueryProvider` handle it via `meta`.

## 7. Data Integrity (Cascade Policy)

- **Safe Category Deletion**: Deleting a category automatically unlinks all associated blogs and case studies (re-assigning them to `null` / Uncategorized).
- **Portfolio Cascade**: Deleting a portfolio will **permanently delete** all associated blogs, case studies, and media assets. This is non-reversible.

---

**Protocol Version: 1.4.0**  
**Status: ENFORCED**
