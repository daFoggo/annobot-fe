# Architecture

startcn-base uses feature-based frontend architecture with route-level orchestration.

## Directory Map

```text
src/
|-- components/
|   |-- ui/           # shadcn-style primitives and molecules
|   `-- common/       # reusable organisms
|-- configs/          # environment and config objects
|-- features/         # feature modules
|-- lib/              # cross-cutting setup and helpers
|-- routes/           # TanStack Router route tree
`-- types/            # shared TypeScript types
```

## Architecture Principles

- A feature owns its own schemas, query options, mutations, server functions, and feature-specific components.
- Routes compose features into pages and decide which data is critical.
- Shared components in `components/common` must be reusable across multiple features.
- Layout components (e.g. sidebar, header) are app-shell concerns, not feature-specific concerns.
- Cross-cutting library setup belongs in `src/lib`.

## Feature Boundary

Standard feature shape:

```text
src/features/[feature]/
|-- components/      # cross-page / shared / cross-cutting feature UI
|-- server.ts
|-- functions.ts
|-- queries.ts
|-- schemas.ts
`-- index.ts
```

Responsibilities:

| File | Responsibility |
|---|---|
| `server.ts` | Server-only IO: Supabase access và/hoặc AnnoBot HTTP calls qua ky (`api` từ `@/lib/ky`) |
| `functions.ts` | `createServerFn` wrappers và validation |
| `queries.ts` | Query key factories, `queryOptions`, mutation hooks |
| `schemas.ts` | Zod schemas và exported types |
| `components/` | Cross-page / shared / cross-cutting feature UI |
| `index.ts` | Client-safe public API |

## Two Data Backends

The app has two supported data sources. Both follow the **same** feature shape: IO lives in `server.ts`, is wrapped by `createServerFn` in `functions.ts`, and is consumed through `queries.ts`. Never call either client directly from `queries.ts` or components.

| | Supabase | AnnoBot HTTP backend (ky) |
|---|---|---|
| Client | `@supabase/supabase-js` — shared instance in `src/utils/supabase.ts` | `ky` — shared instance `api` in `src/lib/ky.ts` |
| IO location | feature `server.ts` (server-only) | feature `server.ts` (server-only, imports `@tanstack/react-start/server-only`) |
| Response shape | Supabase `{ data, error }` — check `error`, translate `PGRST116` → `notFound()` | `ResponseSchema<T>` (`{ success, message, data }`) — unwrap `response.data` |
| Auth | server-side session (e.g. `supabase.auth`) | Bearer token tự động gắn bởi ky (server session cookie), 401 → refresh → retry |
| Error handling | `getErrorMessage(error, fallback)` | `getErrorMessage(error, fallback)` |

Example (Supabase, feature `server.ts`):

```ts
import "@tanstack/react-start/server-only";
import { supabase } from "@/utils/supabase";

export const getUserById = async (userId: string) => {
	const { data, error } = await supabase
		.from("users")
		.select("*")
		.eq("id", userId)
		.single();
	if (error) throw error;
	return data;
};
```

Example (ky, feature `server.ts`):

```ts
import "@tanstack/react-start/server-only";
import { api } from "@/lib/ky";
import type { TBaseResponse } from "@/types/api";

export const getExperiment = async (id: string) => {
	const response = await api
		.get(`experiments/${id}`)
		.json<TBaseResponse<Experiment>>();
	return response.data;
};
```

Both are then wrapped in `functions.ts` (`createServerFn` + validator) and exposed through `queries.ts` (`queryOptions` + mutation hooks). See `04_tanstack_start_query_router.md` → "Two Data Source Patterns" for the full playbook.

A feature is a **vertical slice**: it owns the data contract AND the UI that renders that data where the UI crosses page boundaries (a preview used on the home page and its own page, a dialog triggered from many places, an auth button). Page-local views of a feature's data live with the route that renders them (see Component Placement Rule below).

## Barrel Rule

Feature internals are private by default.

Use:

```ts
import { userMeQueryOptions } from "@/features/users"
```

Avoid:

```ts
import { userMeQueryOptions } from "@/features/users/queries"
```

Exception: direct imports may be used when there is an intentional internal boundary, but do not make that the default.

Never export `server.ts` or modules marked with `"@tanstack/react-start/server-only"` from `index.ts`.

## Component Placement Rule

Where UI and data live is decided by **scope of reuse + domain coupling**, not by "is it UI or logic". The same rule applies to components **and** to data (schemas, `server.ts`, `functions.ts`, `queries.ts`):

| Kind | Home |
|---|---|
| Implements a **cross-cutting capability** (auth, search, analytics) or is **used from ≥2 places** (routes, other features, app shell) | `features/[feature]/components/` and `features/[feature]/*.ts` |
| Page-local views (rendered by exactly one route) | `routes/<area>/-components/` |
| Static page content (marketing copy, logo lists, CTA cards) | Inline const data in the route file |
| Domain-agnostic, app-wide UI (layout, shell, section chrome) | `components/common/` |
| Primitives | `components/ui/` |

Rules:

- **Private sub-parts stay put.** A form used only inside a feature dialog, or an internal cell of a feature view, stays in the feature regardless of consumer count. The rule applies at the route-vs-feature boundary, not inside a feature.
- **Promote, don't predict.** When a route-local component or data module gains a second consumer, promote it to the owning feature (move file + update imports). This is a mechanical, low-cost step; do not pre-place single-consumer UI/data in a feature speculatively.
- **Route colocation is a first-class pattern** — the `-` prefix is TanStack Router's official convention: files/folders prefixed with `-` inside `routes/` are excluded from the route tree. Use `routes/<area>/-components/` for page-local views.
- **Static content ≠ data.** Marketing copy, logo lists, and CTA cards are static page content: keep them as plain const data in the route file (or `-components/` view props), never through `createServerFn`/queries. Only genuinely dynamic data (records from a backend, aggregate counts) goes through the data layer.
- **Dynamic data that is page-local → feature when it crosses pages.** E.g. hero stats are aggregate counts used by both the home page and a future admin dashboard → they live in a `features/analytics` module, not in the route.
- A "page" like the home/landing page is **not a feature**: it is a route that composes features. Its page-local sections live in `routes/.../-components/`, and its content is either static inline data or data owned by the owning feature.

## Route Orchestration

Routes own page-level composition:

- Pull widgets from multiple features.
- Decide required vs secondary data.
- Add route-level `errorComponent` / `notFoundComponent` where needed.
- Keep feature modules decoupled from each other.

Feature A should not import Feature B's page widget just to compose a route. Put that composition in `src/routes`.

## Layout Organization (Multiple App Shells)

When a project has more than one visual shell — e.g. a **marketing** shell (navbar + footer) and a **dashboard** shell (sidebar + topbar) — organize them with **pathless layout routes** (`_` prefix). This is the TanStack-native mechanism for applying a different layout without changing the URL.

```text
src/routes/
├── __root.tsx                  # root: fonts, theme, QueryClient provider
├── {-$locale}/                 # optional locale segment (matches / and /vi)
│   ├── route.tsx               # locale layout: i18n provider + locale guard only
│   ├── _marketing/             # pathless layout — no URL segment
│   │   ├── route.tsx           # AppLayout + AppNavbar + AppFooter + <Outlet />
│   │   ├── index.tsx           # home (URL: /)
│   │   ├── research/areas.tsx  # URL: /research/areas
│   │   └── ...
│   └── _dashboard/             # pathless layout — no URL segment
│       ├── route.tsx           # DashboardLayout: sidebar + topbar + <Outlet />
│       ├── admin/index.tsx     # URL: /admin
│       └── ...
```

Rules:

- **Pathless layout route (`_name/route.tsx`)** is the unit of shell selection. Each shell's `route.tsx` renders its chrome + `<Outlet />`; children live in that folder and inherit the shell. It does **not** add a URL segment.
- **Route groups `(name)/` do NOT apply layouts** in TanStack Router — they are purely organizational and invisible to the route tree. Do not confuse them with Next.js route groups (a common trap).
- **Keep concern-separation between locale and shell**: `{-$locale}/route.tsx` stays the i18n/locale layer; each shell is a separate pathless child. This lets marketing and dashboard pages share the same locale routing while having entirely different chrome.
- **Shell components live in `components/common/app-shell/`** — one folder per shell (`AppLayout` for marketing, `DashboardLayout` for dashboard), reusing the same `components/common/` + `components/ui/` primitives. App-specific layout is never a feature.
- **Nest further when needed**: a complex area (e.g. a settings sub-area) can add another pathless layout `_dashboard/settings/route.tsx`, mirroring multi-tier shells (AppLayout → ProjectLayout → FeatureLayout).
- **Scope providers to the layout tier** (Supabase pattern): wrap `SessionProvider` / area context inside `_dashboard/route.tsx`, not the root — memory is released when leaving that area. Keep URL as the source of truth for active nav state (read the matched segment, don't store it in global state).
- **Monorepo is optional**: split into `apps/*` only when bundle/complexity demands (Supabase separates `www` vs `studio`). For a mid-size project, pathless layouts in a single app are the right default; defer monorepo until a real second app exists.

## Feature Data Boundary

Feature components should not fetch data from another feature.

If a component in `src/features/[feature]/components` needs data owned by another feature, move that data dependency to a route, layout, or route-local container and pass it down through props. Pass all relevant states, not only the successful data:

- data
- loading state
- error state
- error object, when UI copy needs `getErrorMessage`
- callbacks for cross-feature actions

Avoid fetching cross-feature data directly in layout/presentation components:

```tsx
const { data: user } = useQuery(userMeQueryOptions)
```

Prefer route/layout orchestration (e.g. in `routes/dashboard/route.tsx`):

```tsx
const user = useQuery(userMeQueryOptions)

return (
  <AppSidebar
    user={user.data}
    isUserPending={user.isPending}
    isUserError={user.isError}
    userError={user.error}
  />
)
```

Allowed coupling:

- feature-local mutation hooks inside the same feature
- own-feature queries for deliberately self-contained widgets
- type-only imports from another feature's public barrel
- aggregate schemas that model backend aggregate payloads
- query key imports for cache invalidation
- callbacks or injected adapters for cross-feature workflows

When a feature component renders a cross-feature workflow, such as a member invite dialog requiring user search or an inbox item accepting an invitation, inject the searched data and action callbacks from the route/container instead of importing the other feature's query or mutation hook.

Common boundary patterns:

- App shell sidebar (`AppSidebar`) and `UserProfile` receive user context and logout callbacks via props from `routes/dashboard/route.tsx`.
- Feature components receive user-specific options, roles, or configurations from route loaders/containers.
- Table columns that need global user context or specific configuration values are created by column factory functions, receiving context as arguments.

## QueryClient Lifecycle

The app must not use a request-shared module singleton `QueryClient` for user data.

Expected shape:

- `src/lib/query-client.ts` exports `createQueryClient()`.
- `src/router.tsx` creates a fresh client inside `getRouter()`.
- Router context and `QueryProvider` receive the same client.
- Auth clear/sign-out flows clear the active `useQueryClient()` instance.

## Error Boundaries

Use nested route boundaries for important app areas so one section failure does not replace the whole app shell.

## Router Configuration Patterns

The app shell in `src/router.tsx` already enables several TanStack Router features; keep them documented here:

- **Preloading**: `defaultPreload: "intent"` preloads route data on hover/touch. `defaultPreloadStaleTime: 0` delegates the freshness decision to TanStack Query (avoid the 30s default that would skip refetching).
- **Scroll restoration**: `scrollRestoration: true`. If a layout uses its own scroll container, declare `scrollToTopSelectors` so it resets too.
- **Automatic code splitting**: do not export `component`/`loader`/`errorComponent` from route files at module top level — TanStack Router splits them automatically. `__root.tsx` is never split (always rendered).

### Route Tree Conventions

- `__root.tsx` — root route (required name, at the routes directory root).
- `index.tsx` — index route.
- `$param` — dynamic segment.
- `_` prefix (`_layout`) — **pathless layout route** (matches children without adding a URL segment). See [Layout Organization](#layout-organization-multiple-app-shells).
- `_` suffix (`posts_`) — break-out route (excluded from nesting under parent routes).
- `(folder)` — **route group**, purely organizational, no layout and no URL segment. Do not confuse with Next.js route groups; use `_name/route.tsx` when you actually need a layout.
- `-` prefix files/folders — excluded from the route tree (colocate helpers/logic).
- `$` (`$.tsx`) — splat route (matches rest of path, `_splat` param).
- `.route.tsx` — route file type marker.
- Route matching is by specificity, not file order: index → static (most→least specific) → dynamic (longest→shortest) → splat.

### Static Route Data

Use `staticData` for static per-route metadata (titles, nav items, layout visibility) — the app already types it via declaration merging in `src/router.tsx`:

```ts
declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    getTitle?: () => string
    navItems?: NavItem[]
  }
}
```

Rule: static metadata → `staticData`; dynamic/per-request/auth data → router `context` (not `staticData`).

### Document Head

Each route can declare `head: () => ({ title, meta, links })`. Render `<HeadContent />` in `<head>` and `<Scripts />` in `<body>` (already in `__root.tsx`). Nested routes dedupe head tags — the last (deepest) wins. Use `ScriptOnce` for scripts that must run before hydration (theme detection).

### Navigation Blocking (forms)

Use `useBlocker` when a form is dirty to confirm navigation, and enable `enableBeforeUnload` to also guard refresh/close. Custom dialog via `status === "blocked"` + `proceed`/`reset`.

### Mutation / Route-Change Cleanup

Long-lived UI state (optimistic messages, drafts, form state) can resurface when navigating back. Reset it on route resolve:

```ts
router.subscribe("onResolved", () => {
  // clear draft/transient Zustand or mutation UI state
})
```
