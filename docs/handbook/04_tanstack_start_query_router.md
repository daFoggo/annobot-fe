---
name: tanstack-data-fetching
description: Apply the canonical TanStack Start/Router/Query data-fetching patterns for both data sources (Supabase and the AnnoBot ky backend). Use when writing or reviewing query functions, query keys/options, route loaders, mutations, or Supabase/ky access. Covers the query contract, loader policy, suspense rules, and QueryClient lifecycle.
---

# TanStack Start, Router, Query, and Data Source Patterns

## When to Use

- Writing a query function, key factory, or `queryOptions`.
- Deciding route loader criticality and Suspense usage.
- Adding a mutation, invalidating caches, or accessing a data source (Supabase or AnnoBot ky backend).

## Approved Stack

- TanStack Start for app/server function integration.
- TanStack Router for routes, loaders, route context, error boundaries, and not-found handling.
- TanStack Query for server-state caching, loading/error states, invalidation, retries, and mutations.
- Two data sources, both accessed server-side through feature `server.ts` + `functions.ts`:
  - **Supabase** JS client for database, auth, and realtime access (`src/utils/supabase.ts`).
  - **AnnoBot HTTP backend** via the shared `ky` instance (`src/lib/ky.ts`).
- Zod for validation.

Do not introduce another server-state cache layer or hand-rolled `fetch` wrappers.

## Query Function Contract

A query function must either return real data or throw an error.

In practice, this means:

- If the request succeeds, return the payload the UI should actually use.
- If the request fails for a real transport/server/auth problem, let the error bubble up.
- Only catch errors when you are intentionally translating a known domain case, such as `404 -> notFound()`.

Wrong:

```ts
try {
  const { data } = await supabase.from("users").select("*")
  return data ?? []
} catch (error) {
  console.error(error)
  return []
}
```

Correct:

```ts
const { data } = await supabase.from("users").select("*")
return data
```

This repo also has one related pattern for list endpoints: the query function may normalize a missing Supabase payload to an empty list, for example `return data ?? []`. That is not the same as swallowing an error in a `catch` block.

Only catch known domain cases:

```ts
try {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()
  if (error) throw error
  return data
} catch (error) {
  if (error.code === "PGRST116") {
    throw notFound()
  }

  throw error
}
```

That pattern is used for detail resources in this repo: a missing user or key resource becomes `notFound()`, while everything else still fails normally so the route or UI can show the real error state.

## Query Keys

Each feature owns a key factory:

```ts
export const userKeys = {
  all: ["users"] as const,
  me: () => [...userKeys.all, "me"] as const,
  searches: () => [...userKeys.all, "search"] as const,
  search: (q: string) => [...userKeys.searches(), q] as const,
}
```

Use key factory prefixes for invalidation.

## Query Options

Export query options factories:

```ts
export const searchUsersQueryOptions = (q: string) =>
  queryOptions({
    queryKey: userKeys.search(q),
    queryFn: () => searchUsersFn({ data: { q } }),
  })
```

Use the same options in loaders, components, and cache APIs:

```ts
await context.queryClient.query(searchUsersQueryOptions(query))
const { data } = useSuspenseQuery(searchUsersQueryOptions(query))
queryClient.invalidateQueries({ queryKey: userKeys.searches() })
```

## Important Defaults

TanStack Query ships "aggressive but sane" defaults — know them to avoid surprise refetches:

- **`staleTime: 0`** — cached data is considered stale immediately, so queries refetch on mount, window focus, and reconnect. For SSR, set a higher default `staleTime` (this repo: 5 min) so prefetched data is not refetched on the client.
  - `staleTime: Infinity` — never refetch unless manually invalidated.
  - `staleTime: 'static'` — never refetch, **even if `invalidateQueries` is called** (stricter than `Infinity`). Use for immutable data loaded at boot (feature flags, permissions, static reference tables); use `Infinity` when manual invalidation should still work.
- **`gcTime: 5 min`** — inactive queries (no mounted observers) are garbage collected after this. Set per-query or globally (this repo: 10 min).
- **Queries retry 3 times** with exponential backoff on failure; mutations do **not** retry by default.
- **Structural sharing** keeps the previous data reference when nothing changed — only JSON-compatible data benefits.

## Render Optimizations

- **Structural sharing**: unchanged query data keeps its reference across re-renders (enables `useMemo`/`useCallback` stability). Don't disable it.
- **Tracked properties**: `useQuery` only re-renders when a property you actually read changes (proxy-based). Object-rest destructuring disables this — destructure only the flags you use.
- **`select`**: subscribe to a subset / transform:

```ts
export const useTodoCount = () =>
  useQuery({
    ...todosQueryOptions(),
    select: (data) => data.length, // re-renders only when length changes
  })
```

  - Inline `select` re-runs every render; wrap in `useCallback` or extract a stable function.
  - `select` runs on successfully cached data — **not** the place to throw errors; keep error handling in `queryFn`.
  - When passing query objects inline to `useQueries`/`useSuspenseQueries`, an inline `select` can't infer its `data` type — annotate the parameter or define the query with `queryOptions(...)` (preferred).

## Route Loader Policy

Routes decide criticality.

This is the core mental model:

- Critical data blocks route rendering with an awaited `queryClient.query(...)`.
- Secondary data may be prefetched fire-and-forget, but its component must still render local states.
- Failed query data is never an empty state.
- Suspense must be backed by a loader guarantee.

| Data kind | Loader | Component |
|---|---|---|
| Critical route data | `queryClient.query(...)` (awaited) | `useSuspenseQuery` / `useSuspenseQueries` |
| Secondary widget data | `queryClient.query(...)` fire-and-forget (`void ... .catch(noop)`) | `useQuery` with local states |
| Optional/search/inline data | Usually no blocking loader | `useQuery` with `enabled` |

Do not use `useSuspenseQuery` for data that is only fire-and-forget prefetched.

## Suspense Rules

- Suspense query options should not include `enabled` (`useSuspenseQuery` does not accept `enabled`; it is excluded from its options).
- Route params are the precondition for critical route data.
- Use `enabled` for optional, search, and inline component-local queries.
- Missing critical resources should become `notFound()` only for known 404 cases.
- Unknown failures should propagate to the nearest route error boundary.

> [!NOTE]
> The loader methods `ensureQueryData` and `prefetchQuery` are deprecated in TanStack Query and will be removed in the next major version. Use `queryClient.query(...)` instead: `await` it for critical route data, or fire it off with `void queryClient.query(...).catch(noop)` for secondary data. `query()` refetches when the cached data is stale; if you want the exact `ensureQueryData` behavior (reuse the cache as-is, never refetch stale data), pass `{ ...options, staleTime: 'static' }`. See the Query prefetching guide.

## Mutation Policy

```ts
const updateProfile = useMutation({
  mutationFn: updateProfileFn,
  onSuccess: async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: userKeys.me() }),
    ])
  },
})
```

Rules:

- Shared mutation hooks own cache correctness.
- Components own UX side effects.
- Avoid `toast` and `router.navigate` inside shared mutation hooks.
- Await invalidation when pending state should last until related cache updates finish.

### Optimistic Updates

For interactions where instant feedback matters (toggles, likes, status changes), use the documented cache workflow in `onMutate` / `onError` / `onSettled`:

```ts
useMutation({
  mutationFn: updateTodoFn,
  onMutate: async (variables) => {
    // 1. Cancel outgoing refetches so they don't overwrite our update
    await queryClient.cancelQueries({ queryKey: todoKeys.detail(variables.id) })
    // 2. Snapshot the previous value
    const previous = queryClient.getQueryData(todoKeys.detail(variables.id))
    // 3. Optimistically update the cache
    queryClient.setQueryData(todoKeys.detail(variables.id), variables)
    // 4. Return the snapshot for rollback
    return { previous }
  },
  onError: (_err, _variables, context) => {
    // Roll back on failure
    queryClient.setQueryData(todoKeys.detail(variables.id), context?.previous)
  },
  onSettled: () => {
    // Revalidate the source of truth
    queryClient.invalidateQueries({ queryKey: todoKeys.detail(variables.id) })
  },
})
```

Rules:

- Always `cancelQueries` first, snapshot with `getQueryData`, then `setQueryData`.
- Roll back from the snapshot in `onError`; invalidate in `onSettled`.
- Update the cache immutably — never mutate data retrieved from the cache in place.
- If the optimistic result is only shown in one place, prefer `variables` + `isPending` from `useMutation` instead (less code).
- Use `useMutationState` + a `mutationKey` when the optimistic result must render in a different component than the mutation.

### Mutation Response → Cache Write

When a mutation response contains the canonical row, write it to the cache directly instead of refetching:

```ts
onSuccess: (data) => {
  queryClient.setQueryData(todoKeys.detail(data.id), data)
}
```

## Parallel vs Serial Queries

- Multiple `useQuery` hooks in the same component run in parallel — fine.
- Multiple `useSuspenseQuery` hooks in the same component run **serially** (each suspends in order) — a request waterfall. Use `useSuspenseQueries` to fetch them in parallel:

```ts
const results = useSuspenseQueries({
  queries: [userQueryOptions(id), postsQueryOptions(id)],
})
```

- Dependent queries (`enabled: !!id`) are also a form of waterfall. Flatten the API into a single request when possible.
- **Nested component waterfall**: if a parent waits for its query before rendering a child that also queries, the child's fetch only starts after the parent's resolves. Hoist the child's query to the parent (or prefetch it) so both fetch in parallel.

## Request Waterfalls

A request waterfall is a fetch that only starts after another fetch finished — each hop adds a network roundtrip (especially costly on high latency). Three common React Query causes:

1. **Serial suspense** — multiple `useSuspenseQuery` in one component (use `useSuspenseQueries`).
2. **Dependent queries** — `enabled: !!id` waits for a previous query (flatten the API, or move to server where latency is lower).
3. **Nested components** — parent query → child query. Fix: hoist the child's query into the parent and pass data via props, or prefetch the child's query at the router/loader level.

Check the Network tab for waterfalls. Not every waterfall must be flattened, but watch the high-impact ones. SSR moves these waterfalls to the server (lower latency), but SPA client-side navigation re-introduces them unless you prefetch at the router level.

## Prefetching

Prefetching populates the cache ahead of time to flatten waterfalls and speed up navigation.

- **Route loader** (recommended, integrates with SSR): use `queryClient.query(...)` — `await` critical data, or fire-and-forget `void queryClient.query(...).catch(noop)` for secondary data. Loader prefetched data is served immediately by `useQuery`/`useSuspenseQuery`.
- **In components**, before a suspense boundary you cannot use `useSuspenseQueries` (it would block render) nor `useQuery` (starts after suspense resolves). Use the dedicated hooks:

```ts
import { usePrefetchQuery } from "@tanstack/react-query"

function ArticleLayout({ id }) {
  // Starts fetching immediately, does not block rendering
  usePrefetchQuery({ queryKey: ["comments", id], queryFn: fetchComments })
  return <Suspense fallback="Loading"><Article id={id} /></Suspense>
}
```

- **In event handlers** (hover/focus on a link): `void queryClient.query({ queryKey, queryFn, staleTime: 60000 }).catch(noop)`.
- **Prefetch inside a queryFn**: useful when a query almost always needs a related query — fire the dependent prefetch before returning the primary data.
- `queryClient.query` returns the result and **throws on error**. For non-critical prefetches, swallow with `.catch(noop)`; the subsequent `useQuery` will retry on mount.
- `setQueryData(key, data)` seeds the cache synchronously when you already have the data (no network).

> [!NOTE]
> Infinite queries can be prefetched with `queryClient.infiniteQuery(...)` (first page by default, `pages` option to prefetch more) and `usePrefetchInfiniteQuery` in components.

## placeholderData vs initialData

- `initialData` is **persisted to the cache** — use it only for real data (e.g. reusing a parent detail query). Never pass placeholder/partial data.
- `placeholderData` is **not persisted** and shows immediately while the real fetch runs. Use it to keep the previous page/list visible:

```ts
queryOptions({
  queryKey: [...],
  queryFn: fetchPage,
  placeholderData: keepPreviousData, // paginated/infinite: keep last data during refetch
})
```

- When using `placeholderData`, the query reports `isPlaceholderData: true` — use it to disable "Next" or dim stale content.

## Loading Indicators: isPending vs isFetching

- `isPending` — no data yet → hard loading state (`<Skeleton>`).
- `isFetching` — background refetch while data exists → lightweight indicator ("Refreshing…"), never a full skeleton.
- Global progress: `useIsFetching()`.

## Query Cancellation

- Query functions receive an `AbortSignal`; pass it to `fetch`/Supabase so in-flight requests can be cancelled:

```ts
queryFn: ({ signal }) => fetch("/api/users", { signal }).then((r) => r.json())
```

- Cancellation does **not** work with Suspense hooks (`useSuspenseQuery`, `useSuspenseQueries`, `useSuspenseInfiniteQuery`).

## QueryClient Lifecycle

SSR-safe pattern:

```ts
export function getRouter() {
  const queryClient = createQueryClient()

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
  })

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    wrapQueryClient: false,
  })

  return router
}
```

Rules:

- Do not import a module-level `queryClient` singleton for user data.
- Create QueryClient through `createQueryClient()`.
- Create it in the router/request lifecycle.
- Pass the same instance to router context and `QueryProvider`.
- Clear query caches from auth mutation and account-switch flows when the signed-in identity changes.

## Two Data Source Patterns

The app reads from two backends. Both must follow the same feature shape: IO in `server.ts`, wrapped by `createServerFn` in `functions.ts`, consumed by `queries.ts`. Do not call Supabase or `ky` directly from `queries.ts` or components.

### Shared Rules (both sources)

- `server.ts` is server-only: add `import "@tanstack/react-start/server-only"` at the top.
- Query functions resolve valid data or throw; translate only known domain cases (e.g. `PGRST116` → `notFound()`, 404 → `notFound()`).
- UI and mutation catch blocks use `getErrorMessage(error, fallback)` from `src/lib/error.ts`.
- Do not swallow errors into empty arrays or fallback objects.

### Supabase Pattern

Client is centralized in `src/utils/supabase.ts` (single `createClient()` with `VITE_*` env vars) — never create ad-hoc clients.

```ts
// src/features/[feature]/server.ts
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

```ts
// src/features/[feature]/functions.ts
import { createServerFn } from "@tanstack/react-start";

export const getUserByIdFn = createServerFn({ method: "GET" })
	.validator(z.object({ userId: z.string() }))
	.handler(async ({ data }) => getUserById(data.userId));
```

Rules:

- Use a single `createClient()` instance with the `VITE_*` env vars.
- Use `select("*")` explicitly instead of relying on default projections.
- Check `error` on every Supabase response; `data` can be `null` on errors.
- For detail resources, use `.single()` and translate known no-row errors (e.g. `PGRST116`) into `notFound()`.
- Auth/session-aware code (e.g. `supabase.auth`) goes in feature `server.ts` behind a server function; the client session is read server-side, never in component queries.

Correct:

- Supabase errors propagate to the caller.
- UI calls `getErrorMessage`.
- Query functions return valid data or throw.

Incorrect:

- query functions return fallback data after a Supabase failure.
- swallowing `error` and hiding failed UI behind empty states.
- creating ad-hoc Supabase clients inside features.
- calling `supabase` directly from `queries.ts` or components.

### AnnoBot Backend (ky) Pattern

The FastAPI backend (`anno-bot-merge`, base `http://localhost:40723`, prefix `/api/v1`) is accessed with the shared `ky` instance from `src/lib/ky.ts` — never hand-rolled `fetch` wrappers.

```ts
// src/features/[feature]/server.ts
import "@tanstack/react-start/server-only";
import { api } from "@/lib/ky";

export const getExperiment = async (id: string) =>
	api.get(`experiments/${id}`).json<Experiment>();
```

```ts
// src/features/[feature]/functions.ts
import { createServerFn } from "@tanstack/react-start";

export const getExperimentFn = createServerFn({ method: "GET" })
	.validator(z.object({ id: z.string() }))
	.handler(async ({ data }) => getExperiment(data.id));
```

Rules:

- The backend returns resource representations directly (no `{ success, message, data }` envelope); `server.ts` types the response as the resource itself. Errors are RFC 7807 problem details (`{ type, title, status, detail }`).
- `ky` automatically attaches the Bearer token (from the server session cookie via `src/lib/auth-token.ts`), retries once on 401 after refreshing, and redirects to sign-in when refresh fails — do not reimplement auth on each call.
- Check the exact endpoint contract in the backend OpenAPI (`http://localhost:40723/openapi.json`) before writing a `server.ts` call.
- Feature auth is session-cookie based (`src/lib/session.server.ts`); `sign-in`/`sign-up`/`refresh` server functions update or clear that session.

## Server Boundary & Middleware (Start)

Server functions are API endpoints. A route `beforeLoad` guard improves route UX but is **not** the security boundary for the data — protect the server function/route that reads or mutates private data.

- Attach auth/authorization at the server function boundary with `createMiddleware()`:

```ts
const authMiddleware = createMiddleware().server(async ({ next }) => {
  // verify the session from a server-trusted source (cookie + DB), then:
  return next({ context: { user } })
})

export const getPrivateData = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    // context.user is available here; unauthorized callers never reach this
  })
```

- Server function middleware has `.server()`, `.client()`, and `.validator()` phases. Client context is **not** sent to the server unless you pass it with `sendContext`. Shape validation is not authorization.
- If the app defines `src/start.ts` for global middleware, re-add the CSRF middleware — otherwise it is installed automatically.

## Environment Variables & Functions

- Server code reads unprefixed `process.env`; client code only reads `VITE_*`/`PUBLIC_*` (via `import.meta.env`).
- **Read env per-request, inside handlers/loaders** — module-scope `process.env.X` reads run before env exists (undefined) and risk inlining secrets into the client bundle.
- For env-dependent code that must differ server/client, use `createIsomorphicFn()` / `createServerOnlyFn()` from `@tanstack/react-start` — they tree-shake the wrong side and throw if called in the wrong environment.

## Import Protection

Import protection is enabled by default in Start: client bundles reject `**/*.server.*` and `@tanstack/react-start/server`; server bundles reject `**/*.client.*`.

- Keep feature barrels client-safe: `index.ts` must not re-export server-only modules (matches `02_architecture.md`).
- Avoid mixed barrels that export both client-safe and server-only values — split into separate entry points, or the barrel leaks server code into the client (or warns in dev).
- Use `import "@tanstack/react-start/server-only"` at the top of server-only files.

## Selective SSR

- Route `ssr: true` (default) renders on the server. `ssr: false` renders client-only (with `pendingComponent` as the server fallback). `ssr: "data-only"` runs `beforeLoad`/`loader` on the server but renders on the client.
- The loader (`queryClient.query(...)`) only runs on the server when the route's `ssr` setting allows it.
- Inheritance is restrictive-only: a child can make SSR more restrictive, never less.

## Server Routes vs Server Functions

- **Server functions** (`createServerFn`) — for calling server logic from inside the app, with serialization handled for you. Use for mutations/reads from components and loaders.
- **Server routes** (`createFileRoute` + `server.handlers` with GET/POST/...) — HTTP endpoints called from outside the app (webhooks, external clients, raw API). Same file-based routing, params `$id`/`$`, route-level `server.middleware`.

## ISR & Static Prerendering

- ISR in Start uses standard HTTP cache headers (not a framework `revalidate` option): `Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400` via a route `headers()`.
- `max-age` = browser cache, `s-maxage` = CDN, `stale-while-revalidate` = serve stale while revalidating.
- User-specific pages must use `private`/`no-store` — never let a CDN cache another user's data.
- Static prerender: dynamic routes (`$param`) are excluded from auto-discovery; enable `crawlLinks` or list them in `prerender.pages` explicitly.
