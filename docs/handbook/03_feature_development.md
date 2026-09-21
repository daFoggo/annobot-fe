---
name: feature-development
description: Build or refactor a feature module under src/features/. Use when adding a feature, wiring queries/mutations/functions/schemas, or composing cross-feature pages in routes. Covers the feature checklist, import rules, mutation side effects, and async UI requirements.
---

# Feature Development

## When to Use

- Creating or refactoring a `src/features/[feature]/` module.
- Adding query options, mutations, server functions, or schemas.
- Wiring cross-feature data into a route and deciding async UI states.

## Feature Checklist

1. Create or update `src/features/[feature]/`.
2. Define schemas and types with Zod.
3. Put server-only API logic in `server.ts` — Supabase via `@/utils/supabase` **or** AnnoBot HTTP via `api` from `@/lib/ky` (see `04_tanstack_start_query_router.md` → "Two Data Source Patterns").
4. Wrap server logic with `createServerFn` in `functions.ts`.
5. Define query keys, query options, and mutations in `queries.ts`.
6. Build cross-page / shared / cross-cutting feature components in `components/`; page-local views live in `routes/.../-components/` (see `02_architecture.md` → Component Placement Rule).
7. Export only client-safe modules from `index.ts`.
8. Compose the feature into pages from `src/routes/`.

## Import Rules

- Use `@/*` imports.
- Prefer feature barrels for public feature API.
- Do not export server-only code through feature barrels.
- `queries.ts` imports server functions from `functions.ts`, not from `server.ts`.
- `components/` should not import from `server.ts`.
- `components/` should not import another feature's query or mutation hook for page composition. Move cross-feature data/actions to a route or layout container and inject props/callbacks.
- Feature internals should use relative imports for same-feature modules instead of importing their own public barrel.
- `components/` holds only UI that crosses page boundaries or is shared within/around the feature. A view used by exactly one route is page-local and belongs in that route's `-components/` folder; promote it into the feature when a second consumer appears (`02_architecture.md` → Component Placement Rule).
- Data source clients are never imported outside `server.ts`: no `supabase` from `@/utils/supabase` and no `api` from `@/lib/ky` in `queries.ts`, `functions.ts`, or components.

## Mutation Side Effects

Mutation hooks own server-state correctness:

- invalidation
- optimistic updates
- rollback
- direct cache writes

Components own user experience:

- toast messages
- dialog close/open state
- navigation
- local status
- form reset

Use `mutateAsync` only when the component needs to compose follow-up side effects.

## Cross-Feature Data

When a feature component needs another feature's data:

1. Load the dependency in the route, layout, or route-local container.
2. Keep critical data in the route loader with `queryClient.query(...)` (awaited) and Suspense.
3. Keep optional/search data in the route/container with local `useQuery`.
4. Pass data, loading flags, error flags, and errors through props.
5. Disable submit-critical actions while the injected dependency is loading or errored.
6. For tables, use column factories that receive context instead of querying inside cells.

Do not default failed cross-feature data to an empty list just to keep the feature component simple. Empty UI is only valid after a successful empty response.

Practical examples:

- Layout headers and sidebars should not query the current user or authentication status directly. The orchestration route (e.g. `routes/dashboard/route.tsx`) passes down user context, loading/error states, and logout callbacks.
- User management table cells should not fetch user profiles inside each cell. Reusable table column setups should be generated with factories like `getColumns({ currentUserId })`.
- Interactive settings forms (like theme, profile updates) receive default values and update callbacks via props from parent layouts or route loaders.

## Async UI Requirements

Every `useQuery` surface needs explicit state handling:

- loading
- error
- empty, if the data can validly be empty

Do not write code where a failed query becomes:

- `[]`
- `null`
- hidden UI
- default `order: 0`
- empty selection options
- submit payload with missing `user_id` or `team_id`

If a query feeds submit-critical data, disable the action while the query is loading or errored.
