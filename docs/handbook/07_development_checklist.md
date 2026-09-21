---
name: development-checklist
description: Review implementation against the project's architecture, data, and UI rules. Use before, during, and after coding a feature to verify feature boundaries, data fetching (Supabase & AnnoBot ky backend), UI states, mutations, and error handling.
---

# Development Checklist

## When to Use

- Before starting a feature (boundaries, orchestration, existing components).
- During implementation (data fetching, UI state, mutations).
- Before merging (review checklist).

## Before Coding

- Identify the feature owner under `src/features/`.
- Check whether the route should orchestrate multiple features.
- Decide whether data is critical route data or secondary widget data.
- Check existing `@/components/ui`, `@/components/common`, and feature components before creating new UI.
- Check existing query key factories and query options before adding new keys.

## Feature Boundary

- `server.ts` is server-only and imports `"@tanstack/react-start/server-only"`.
- `functions.ts` wraps server logic with `createServerFn`.
- `queries.ts` owns query keys, `queryOptions`, and mutation hooks.
- `schemas.ts` owns Zod schemas and exported types.
- `index.ts` exports only client-safe public API.
- Do not export `server.ts` from feature barrels.
- Avoid cross-feature coupling inside feature modules; compose cross-feature pages in routes.
- Do not call another feature's query or mutation hook from a feature component for page composition.
- Move cross-feature data loading/actions to routes, layouts, or route-local containers, then pass data, loading/error state, and callbacks through props.
- Use column factories with injected context instead of querying inside table cells.
- Use relative imports inside a feature instead of importing that same feature through its public barrel.

## Data Fetching

- Query functions return valid data or throw.
- Do not use `catch -> return null`, `catch -> return []`, or `{ error }` payloads for API failures.
- Critical route data uses `queryClient.query(...)` (awaited) and Suspense.
- Secondary widgets use `queryClient.query(...)` fire-and-forget or local `useQuery`.
- Optional/search/inline queries may use `enabled`.
- Suspense query options should not use `enabled`.
- 404 handling should be deliberate: known missing route resources can become `notFound()`, unknown errors rethrow.

## UI State

- Every local `useQuery` surface needs loading and error states.
- Add empty state only for valid empty data.
- Main content uses `Skeleton`, destructive `Alert`, and the `Empty` primitive (`@/components/ui/empty`) for valid empty data.
- Compact spaces use inline `Skeleton`, tiny icon/error text, and compact helper empty text.
- Do not hide failed queries by defaulting to `[]`, `null`, hidden UI, or fallback values.
- If a query feeds submit-critical data, disable the action while loading or errored.

Submit-critical examples:

- current user id
- user search options
- permission / authorization checks

## Mutations

- Shared mutation hooks own invalidation, optimistic updates, rollback, and cache writes.
- Components own toast, dialog state, navigation, local status, and form reset.
- Use `mutateAsync` only when composing follow-up side effects.
- Await invalidation when pending state should include cache refresh.
- Use query key factories for invalidation.

## Data Source and Error Messages

Both data sources (Supabase and the AnnoBot ky backend) follow the same feature shape: IO in `server.ts`, wrapped by `createServerFn` in `functions.ts`, consumed by `queries.ts`. See `04_tanstack_start_query_router.md` → "Two Data Source Patterns".

Supabase:

- Use the shared client from `src/utils/supabase.ts`.
- Check `error` on every Supabase response; never assume `data` is present on failure.
- Translate known no-row errors (e.g. `PGRST116`) into `notFound()` for detail resources.
- Do not swallow Supabase errors into empty arrays or fallback values.
- Auth/session-aware Supabase code lives in feature `server.ts`; never call `supabase.auth` from component queries.

AnnoBot backend (ky):

- Use the shared `api` instance from `src/lib/ky.ts`; no hand-rolled `fetch`.
- `server.ts` types the response as the resource directly (no envelope unwrap); errors are RFC 7807 problem details.
- Do not reimplement Bearer/refresh auth — ky handles it via the session cookie.

Both:

- UI and mutation catch blocks use `getErrorMessage(error, fallback)`.
- `server.ts` imports `"@tanstack/react-start/server-only"`.

## Review Checklist

- Does the change preserve feature boundaries?
- Are cross-feature data dependencies owned by routes/layouts instead of feature components?
- Are cross-feature workflows injected through props/callbacks instead of direct query/mutation imports?
- Does server-state code throw on failure?
- Are route loaders aligned with Suspense usage?
- Is `useSuspenseQuery` backed by an awaited `queryClient.query(...)` in the loader?
- Is `enabled` used only for optional/search/inline queries?
- Are all local query states represented?
- Are failed queries prevented from becoming fake empty data?
- Should any local widget data be route-critical instead?
- Are submit-critical dependency failures blocking actions?
- Are mutation side effects split correctly between hooks and components?
- Are invalidations using key factories?
- Are UI components using existing primitives and composition rules?
- Are primitives used without re-styling their built-in appearance (no `rounded-full`/`text-xs`/`px-4` overrides on default Buttons; `variant`/`size` props chosen instead)?
- Is `className` on a primitive limited to layout or theme-necessitated overrides?
- Are search / language / icon controls composed from primitives (`InputGroup`, `Button`, `DropdownMenuTrigger`) instead of hand-rolled `<button>` pills?
- Are internal button-as-link usages using `Button render={<Link />}` instead of a raw `<a>`?
- Is a compound component (`Object.assign`) present only where sub-parts are actually composed by callers?
- Are single-use sections plain components with no dead `Root`/`Header`/`Card`/`Preset` exports or unused `className`/`...props` threading?
- Are errors displayed through `getErrorMessage`?
- Are source files free of mojibake (encoding corruption)? Scan for `â€¦`, `â€”`, `â€™`, `Ã©`, `Ã¨`, `báº±ng`, `tháº­t`, `Äá»“ng`… — corrupted UTF-8 produced by shell tools (e.g. `Set-Content` in PowerShell) decoding as Latin-1. Re-run the scan after any batch regex/shell edit; fix via the edit tool, not shell writes.
- Did you run the appropriate checks for the size of the change?
