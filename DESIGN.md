# DESIGN.md — Alpha CMS Visual System

This documents the design system as it is actually implemented in `src/styles/globals.css`, `tailwind.config.js`, and `src/components/ui`. Treat this as the source of truth for visual work — it supersedes the "raw/sharp-corner brutalism" description in [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) §2, which describes an earlier stage of the system. The codebase has moved to a **dark, glassy, "Modernized Brutal"** look: high-contrast dark theme, soft rounded corners, translucent cards, signal-green accent.

If DEVELOPMENT_GUIDE.md's rules and this file conflict on a _visual_ detail (corner radius, shadow style), follow this file, since it reflects what's actually shipped. For non-visual rules in that section (Radix primitives, `asChild`, `BrutalConfirm` for destructive actions), DEVELOPMENT_GUIDE.md still governs.

## Theme

Dark-mode only (`color-scheme: dark` is hardcoded in `:root`). All colors are HSL CSS variables consumed through Tailwind's `hsl(var(--x))` pattern — never hardcode hex/rgb colors in components.

| Token                                   | Value                                   | Usage                                               |
| --------------------------------------- | --------------------------------------- | --------------------------------------------------- |
| `--background` / `--card` / `--popover` | `0 0% 3%`                               | near-black base surfaces                            |
| `--foreground`                          | `0 0% 98%`                              | primary text                                        |
| `--primary` / `--accent` / `--ring`     | `142 71% 45%` (Signal Green, `#22c55e`) | CTAs, focus rings, active states                    |
| `--primary-foreground`                  | `144 66% 10%`                           | text on green surfaces                              |
| `--secondary`                           | `0 0% 9%`                               | secondary surfaces (subtly lighter than background) |
| `--muted`                               | `0 0% 12%`                              | muted panels                                        |
| `--muted-foreground`                    | `0 0% 63.9%`                            | secondary text                                      |
| `--destructive`                         | `0 62.8% 30.6%`                         | destructive actions/errors                          |
| `--border` / `--input`                  | `0 0% 25%`                              | default borders                                     |
| `--radius`                              | `0.75rem`                               | default corner radius                               |

Signal green is the one accent color in the system — don't introduce a second brand hue without a reason.

## Surfaces

Two utility classes carry the visual identity — reach for them before hand-rolling card styles:

```css
.brutal-border { rounded-2xl border border-white/10 shadow-sm }
.brutal-card   { rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm
                  backdrop-blur-xl transition-all duration-300
                  hover:shadow-md hover:border-white/20 }
```

- Corners: `rounded-2xl` (soft), not sharp — despite the name "brutal," this is not `rounded-none`.
- Borders: subtle, low-opacity white (`border-white/10`), brightening on hover (`border-white/20`) — not thick black `border-4`.
- Cards: translucent (`bg-card/50` + `backdrop-blur-xl`) for a glass effect, not solid fills.
- Motion: `transition-all duration-300` on interactive surfaces — hover states should feel smooth, not instant/snap.

## Components (`src/components/ui`)

Built on Radix primitives + `class-variance-authority`, following shadcn conventions.

- **Button** (`button.tsx`): variants `default | destructive | outline | secondary | ghost | link | brutal`; sizes `sm | default | lg | xl | icon`. Base radius comes from `rounded-md`, not `rounded-none` — do not add sharp-corner overrides.
  - Always use `asChild` when a `Button` wraps a `Link` or other interactive element — never nest `<a>` inside `<button>`.
- **BrutalConfirm**: mandatory for every destructive action (delete category, delete portfolio, etc.) per DEVELOPMENT_GUIDE.md §7.
- **BrutalTable / BrutalPagination / BrutalLoader**: standard list/table scaffolding for admin CRUD screens — use these instead of building bespoke tables.
- **StatusBadge / badge.tsx**: status pills (publish status, lead status, subscriber status) — reuse the shared enums from `src/schemas/cms.ts` when mapping colors.
- **StarPicker / StarRating**: testimonial rating input/display.
- Form primitives (`input.tsx`, `textarea.tsx`, `select.tsx`, `checkbox.tsx`, `label.tsx`): Radix-backed, styled via the same `--input` / `--border` tokens — don't restyle these per-page.

## Typography

- Font family: `Inter` (`font-brutal` in Tailwind config), falls back to `system-ui, sans-serif`.
- Custom letter-spacing utilities: `tracking-brutal` (`0.2em`) and `tracking-ultrawide` (`0.4em`) — used for section labels / eyebrow text, not body copy.

## Layout conventions

- Admin screens live under `src/app/(admin)/*` and share the dashboard shell in `src/components/dashboard` / `src/components/layout`.
- Content editing (blogs, case studies) uses Tiptap (`@tiptap/react` + starter kit + extensions) for rich text — don't introduce a second editor library.
- Charts use `chart.js` — keep dashboard stat visualizations on this library for consistency (see the `dataviz` skill for chart-specific styling guidance if adding new charts).

## Hard rules carried over from DEVELOPMENT_GUIDE.md

- No local CSS files — extend `globals.css` tokens/utilities or use Tailwind classes.
- No nested `<a>` in `<button>` — use `asChild`.
- Destructive actions must go through `BrutalConfirm`.
