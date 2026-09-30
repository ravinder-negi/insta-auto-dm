# Insta Auto DM

Next.js 16 (App Router, Turbopack) + Supabase. Automatically DMs Instagram commenters who use a keyword, plus a link-in-bio page, lead magnets and products.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build + type check
npm run lint
```

Environment variables live in `.env.local` — see `.env.example` for the required keys.

## Project structure

```
public/                        Static assets (must stay at the repo root)
supabase/                      Supabase CLI workspace
  functions/instagram-webhook/ Deno edge function (excluded from tsconfig)
  migrations/                  SQL migrations
src/
  proxy.ts                     Auth gate for /dashboard (Next 16 renamed middleware -> proxy)
  app/                         Routing only
    layout.tsx                 Root layout, fonts, brand CSS vars
    globals.css                Tailwind v4 entry + design tokens
    (marketing)/               "/" landing page
    (auth)/                    /login /signup /forgot-password /reset-password /auth/callback
    (public)/[username]/       Public link-in-bio page
    dashboard/                 Authenticated app
    api/instagram/             Instagram OAuth + media route handlers
  components/
    ui/                        Shared primitives (Spinner, Toast, StatCard, controls, styles, ...)
    layout/                    App chrome (DashboardShell, UserMenu, ThemeToggle, sign-out)
    icons/                     Icon set
  features/                    Domain code, one folder per domain
    <domain>/components/       Domain components
    <domain>/actions.ts        Server actions ("use server")
  lib/
    supabase/                  Browser + server Supabase clients
    instagram/                 Instagram Graph API config
    auth/                      Admin checks
    utils/                     color, format, accentColors
  types/                       Shared database/domain types
```

Route groups — `(marketing)`, `(auth)`, `(public)` — are stripped from URLs; they exist to group routes and allow per-section layouts.

## Where does a file go?

| The file is...                              | Put it in                              |
| ------------------------------------------- | -------------------------------------- |
| A route (`page`, `layout`, `route`)         | `src/app/...`                          |
| Used by exactly one route                   | that route's `_components/` folder     |
| Owned by one domain (flows, links, ...)     | `src/features/<domain>/`               |
| Shared across route groups                  | `src/components/ui` or `/layout`       |
| A framework-agnostic helper                 | `src/lib/<area>/`                      |
| A shared type                               | `src/types/`                           |

Two rules keep this stable:

- **`src/app/` is for routing only.** Anything in it is a `page`/`layout`/`route` file or lives under an `_components/` folder (the underscore opts it out of routing).
- **Import with the `@/` alias** (`@/components/ui/Spinner`, `@/features/flows/actions`). Relative imports are only for colocated files in the same route folder.

## Conventions

- Server actions live in `features/<domain>/actions.ts` with `"use server"` at the top.
- Supabase access on the server goes through `@/lib/supabase/server`; client components use `@/lib/supabase/client`.
- Brand colors are admin-configurable at `/dashboard/admin/appearance` and applied as CSS variables in `src/app/layout.tsx` (see `src/lib/utils/color.ts`).
- The Instagram webhook is a Deno edge function and is intentionally outside the TypeScript project.
