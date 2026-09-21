---
name: ui-state-patterns
description: Apply the mandatory async UI state rules. Use when rendering any async surface (lists, tables, cards, widgets) or form actions. Covers loading/error/empty/valid states, compact exceptions, submit-critical dependencies, and Suspense vs local UI.
---

# UI State Patterns

## When to Use

- Rendering a `useQuery` / `useSuspenseQuery` surface.
- Adding loading, error, or empty states.
- Gating an action behind a query that feeds critical form data.

## Principle

Failed data is not empty data.

Every async UI must distinguish:

- loading
- error
- valid empty
- valid data

Do not hide failed queries by defaulting to `[]`, `null`, empty UI, or harmless-looking fallback values.

## Standard Main Content Pattern

Use this for pages, lists, tables, grids, cards, and large content panels.

| State | Component | Rule |
|---|---|---|
| Loading | `<Skeleton>` | Hardcode count/layout to match expected content. Do not map unstable indexes from fetched data. |
| Error | `<Alert variant="destructive">` | Use `getErrorMessage(error, fallback)`. |
| Empty | `Empty` (+ `EmptyHeader` / `EmptyMedia` / `EmptyTitle` / `EmptyDescription` / `EmptyContent`) | Use the shadcn `Empty` primitive from `@/components/ui/empty` — never hand-roll the centered icon/title/description/action markup. |

Example:

```tsx
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"

const { data: users, isPending, isError, error } = useQuery(usersQueryOptions)

if (isPending) return <UserListSkeleton />

if (isError) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertDescription>
        {getErrorMessage(error, "Could not load users.")}
      </AlertDescription>
    </Alert>
  )
}

if (users.length === 0) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UsersIcon />
        </EmptyMedia>
        <EmptyTitle>No users yet</EmptyTitle>
        <EmptyDescription>
          Add or invite users to start collaborating.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Invite user</Button>
      </EmptyContent>
    </Empty>
  )
}
```

Use `isPending` for the hard loading check (TanStack Query v5 canonical order: `isPending` → `isError` → assume data). `isLoading` is an alias equal to `isPending && isFetching`; it is equivalent for the common first-fetch case, but `isPending` is type-safe — checking it plus `isError` is what narrows `data` from `undefined`.

Composition (matches the shadcn `empty` primitive):

```text
Empty
├── EmptyHeader
│   ├── EmptyMedia   (variant="icon" or default, e.g. Avatar)
│   ├── EmptyTitle
│   └── EmptyDescription
└── EmptyContent     (Button / InputGroup / link)
```

## Compact UI Exceptions

Use compact state UI only when a full `Alert` or `Empty` would break layout flow:

- sidebars
- headers
- inline status rows
- table cells
- badges
- small widgets
- combobox helper areas
- popover rows

Compact loading:

```tsx
<Skeleton className="h-4 w-24" />
```

Compact error:

```tsx
<div className="flex items-center gap-1.5 text-xs text-destructive">
  <AlertCircle className="size-3.5 shrink-0" />
  <span>{getErrorMessage(error, "Could not load data.")}</span>
</div>
```

Compact empty (the one acceptable hand-rolled `<p>` — full empty states must still use the `Empty` primitive):

```tsx
<p className="text-xs text-muted-foreground">No items yet.</p>
```

## Submit-Critical Query Rule

Some optional-looking queries still feed critical form data. These must block actions while loading or errored.

Examples:

- current user for `user_id`
- user search options
- permission / authorization checks

Rule:

- show a loading state
- show an error state
- disable submit/action when the dependency is loading or errored
- do not fallback to `order: 0`, `user_id: ""`, empty options, or hidden avatars as if the query succeeded

Common failure modes to avoid:

- failed member query -> hidden avatars
- failed user search -> empty search results
- failed config query -> `order: 0`
- failed current user query -> `user_id: ""`

## Suspense vs Local UI

Critical route data:

- route loader uses `queryClient.query(...)` (awaited)
- component uses `useSuspenseQuery`
- route error boundary owns error UI

Optional widget data:

- component uses `useQuery`
- component owns loading/error/empty UI

> [!IMPORTANT]
> The `if (isPending)` / `if (isError)` example above is for **`useQuery` only** (component-owned local states). With `useSuspenseQuery` there is no `isPending`/`isError` branching in the component — `data` is always defined, loading is handled by a `Suspense` fallback, and errors are thrown to the nearest error boundary. Only `isFetching` (background refetch) remains meaningful there.

## Empty State Rules

Only show empty UI when the server returned valid empty data.

Do not show empty state when:

- query errored
- auth dependency failed
- required route param is missing
- search API failed
- config query failed

## Loading Rules

- Use `<Skeleton>`, not custom `animate-pulse` markup.
- Hardcode skeleton count and layout.
- Skeleton should preserve layout dimensions and avoid content jumps.
- For compact spaces, an inline skeleton is enough.

## Loading Flags: isPending / isLoading / isFetching

| Flag | Meaning | Use for |
|---|---|---|
| `isPending` | No cached data yet (`status: pending`). **Canonical** hard-loading check. | `<Skeleton>` |
| `isLoading` | `isPending && isFetching` (no data **and** a fetch in flight). Equivalent for the first fetch; use it if you prefer one flag. | `<Skeleton>` |
| `isFetching` | A request is in flight, including background refetch (data already on screen). | lightweight "Refreshing…" indicator, never a full skeleton |
| `useIsFetching()` | Global count of in-flight queries across the app. | top-level progress |

Rules:

- Use `isPending` (or `isLoading`) → `<Skeleton>`; they are interchangeable for the first-load case.
- Use `isFetching` → a lightweight indicator when data is already on screen — never replace existing content with a skeleton.
- Do not treat a background refetch as a full loading state.

## Error Copy

Use:

```ts
getErrorMessage(error, "Fallback message")
```

Do not parse backend payloads in components. Use `getErrorMessage(error, fallback)` and let the data source (Supabase / ky backend) and TanStack Query surface the underlying error.