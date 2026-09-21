# Agent Instructions

This file is the fast entry point for agents. The detailed source of truth lives in `docs/handbook/`.

## Read Order

1. `docs/handbook/00_index.md`
2. The handbook page that matches the task:
   - `docs/handbook/01_project_overview.md`
   - `docs/handbook/02_architecture.md`
   - `docs/handbook/03_feature_development.md`
   - `docs/handbook/04_tanstack_start_query_router.md`
   - `docs/handbook/05_ui_state_patterns.md`
   - `docs/handbook/06_quality_rules.md`
   - `docs/handbook/07_development_checklist.md`
   - `docs/handbook/08_zustand_best_practices.md`
   - `docs/handbook/09_i18n.md`
   - `docs/handbook/10_design_tokens.md`
   - `docs/handbook/11_tanstack_form.md`
   - `docs/handbook/12_tanstack_table.md`
   - `docs/handbook/13_dashboard_shell.md`

## Core Architecture Rules

- The app uses feature-based architecture under `src/features/`.
- Routes in `src/routes/` are the orchestration layer. Cross-feature page composition belongs in routes, not inside one feature importing another feature's UI arbitrarily.
- Feature components should not fetch cross-feature data. Move cross-feature `useQuery` / `useSuspenseQuery` calls to routes or layout/container components, then pass data plus loading/error state through props.
- Components inside a feature may use their own feature mutation hooks and may use own-feature queries only for deliberately self-contained widgets.
- Cross-feature workflows should receive injected data/callbacks instead of importing another feature's query or mutation hook directly.
- Feature barrels (`index.ts`) are client-safe public APIs. Never export `server.ts` or server-only modules from a feature barrel.
- Use the `@/*` alias for imports instead of long relative paths.

## Feature Shape

```text
src/features/[feature]/
|-- components/
|-- server.ts       # server-only logic
|-- functions.ts    # createServerFn wrappers
|-- queries.ts      # query keys, queryOptions, mutations
|-- schemas.ts      # Zod schemas and exported types
`-- index.ts        # client-safe public API
```

## State Management Rules (TanStack Query vs Zustand)

- **TanStack Query**: Owns all server-state caching, loading/error states, and optimistic mutations. Do not duplicate or mirror server data in Zustand.
- **Zustand**: Owns synchronous client UI state (sidebars, modals, multi-step draft wizards, interactive tool state).
- Always use granular atomic selectors (`useStore(s => s.item)`) or `useShallow` from `zustand/react/shallow` to prevent unnecessary re-renders.
- Guard persisted store state (`persist` middleware) with a hydration check to prevent SSR hydration mismatches in TanStack Start.
- Feature-scoped client stores live in `src/features/[feature]/store.ts` and re-export client-safe hooks via `index.ts`. Global UI stores live in `src/stores/`.

## TanStack Rules

- TanStack Query, Router, and Start are the approved stack for server state, routing, and server functions.
- Query functions must resolve valid data or throw. Do not return `null`, `[]`, or fallback objects for failures.
- Use `queryOptions` factories and feature query key factories.
- Critical route data: `loader` + `context.queryClient.ensureQueryData(...)` + `useSuspenseQuery`.
- Secondary/optional widgets: `prefetchQuery` or local `useQuery`, with local loading/error/empty states.
- Required Suspense query options should not use `enabled`; optional/inline component queries may use `enabled`.
- Shared mutation hooks own cache invalidation, optimistic updates, and cache writes.
- Components own toast, dialog state, navigation, and local UI side effects.
- Do not use a module-level `QueryClient` singleton. Use `createQueryClient()` per request lifecycle.

## Supabase Rules

Supabase is one of two supported data sources (the other is the AnnoBot HTTP backend, see below). It follows the same feature shape: Supabase IO lives in the feature's `server.ts`, wrapped by `createServerFn` in `functions.ts`, and consumed through `queries.ts`. Do not call the Supabase client directly from `queries.ts` or components — the base previously wired it inline and that is the pattern to fix.

- Use the shared client from `src/utils/supabase.ts`. Do not create ad-hoc clients.
- Check `error` on every Supabase response; `data` can be `null` on failures.
- For detail resources use `.single()` and translate known no-row errors (e.g. `PGRST116`) into `notFound()`.
- Do not swallow errors into empty arrays. `data ?? []` is only valid after a successful empty response.
- UI and mutation catch blocks should use `getErrorMessage(error, fallback)` from `src/lib/error.ts`.
- If a feature is auth/session-aware (e.g. uses `supabase.auth`), put it in the feature `server.ts` behind a server function; the client session is read server-side, never in component queries.

## AnnoBot Backend (ky) Rules

The AnnoBot FastAPI backend (`anno-bot-merge`) is the primary data source. It is accessed with the shared `ky` instance from `src/lib/ky.ts` — never hand-rolled `fetch` wrappers.

- All HTTP IO lives in the feature's `server.ts` (server-only, imports `@tanstack/react-start/server-only`) and uses the `api` instance from `@/lib/ky`.
- `functions.ts` wraps each `server.ts` call in a `createServerFn` with `.validator(...)`; `queries.ts` consumes those server functions.
- The backend wraps every response in `ResponseSchema<T>` (`{ success, message, data }`); `server.ts` must unwrap `response.data`.
- `ky` automatically attaches the Bearer token (from the server session cookie), retries once on 401, and redirects to sign-in when refresh fails — do not reimplement auth on each call.
- Check the exact endpoint contract in the backend OpenAPI (`http://localhost:40723/openapi.json`) before writing a `server.ts` call.

## UI State Rules

Every async UI must distinguish loading, error, and valid empty data.

- Loading: use `<Skeleton>` with a hardcoded layout.
- Error: use `<Alert variant="destructive">` and `getErrorMessage(error, fallback)`.
- Empty: use a full empty state composition when data is valid but empty.
- Do not silently hide failed queries by defaulting to `[]` or `null`.
- If a query feeds submit-critical data, disable the action while loading or errored.

## Component Rules (Use Existing, Don't Reinvent)

- **Every UI element comes from an existing primitive in `src/components/ui/`.** Check that folder before writing custom markup.
- Never hand-roll a styled `<button>`, `<a>`-as-button, badge/pill `<span>`, `<div>` card/alert/empty, or `<hr>` when the primitive exists.
- Always use `<Badge>` for pills/tags, `<Skeleton>` for loading, `<Separator>` for dividers, `<Empty>` for empty states, `<Avatar>` (+ `AvatarFallback`), `<InputGroup>` for input+button, `FieldGroup`/`Field` for forms, `ToggleGroup` for 2–7 option sets.
- Primitives' default shape is the design system: choose `variant`/`size` props, do not override `rounded-*`, `text-*`, or `px-*` on them.
- If a primitive is missing, add it with the shadcn CLI (`npx shadcn@latest add <component>`), never hand-write a new UI primitive.
- Use semantic theme tokens and Tailwind default scale only (see `10_design_tokens.md`). No arbitrary values, no raw palette colors, no manual `dark:` overrides.

## Quality Rules

- Prefer small, scoped changes that match existing code patterns.
- Run checks after major multi-file work:
  - `pnpm lint` (Biome)
  - `pnpm check` (Biome)
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm build`
- Do not run expensive checks repeatedly for tiny edits unless requested.
