---
name: tanstack-table
description: Apply the canonical TanStack Table (v9) patterns. Use when building or reviewing data tables, grids, or list views with sorting, filtering, pagination, or selection. Covers features/row models, column definitions, client vs server-side processing, and Query integration.
---

# TanStack Table Patterns (v9)

## When to Use

- Building any data table, grid, or dense listing (users, orders, products, logs).
- Adding sorting, column/global filtering, pagination, row selection, or column visibility.
- Integrating a table with server data (TanStack Query) or client-side row models.

## Approved Stack

- `@tanstack/react-table` (v9) for table state, columns, and row models.
- TanStack Query for the data behind the table (see `04_tanstack_start_query_router.md`).
- `createTableHook` for app-wide table defaults + reusable components.

> [!NOTE]
> TanStack Table v9 is a **plugin architecture** rewrite. APIs changed from v8: `useReactTable` → `useTable`, a required `features` option (via `tableFeatures`), `tableFeatures({})`, and `createTableHook` for composition. Follow v9 patterns; do not copy v8 examples.

## Core Model

The `table` instance is **headless**: it owns state and APIs, not markup. Rendering (`<table>`, headers, cells) is your own UI. Three required inputs:

```tsx
import { tableFeatures, useTable } from "@tanstack/react-table";

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  columnFilteringFeature,
  // row models (client-side processing) are optional:
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filteredRowModel: createFilteredRowModel(),
});

function UsersTable({ data }: { data: User[] }) {
  const table = useTable({ features, columns, data });
  return <table>...</table>;
}
```

Rules:

- `features`, `columns`, `data` are required. `data` must have a **stable reference** (memoized) to avoid infinite re-renders.
- `data` type becomes `TData`; columns must use the same `TData`.
- `tableFeatures` is **static configuration** — define it outside the component (stable, reusable `typeof features` type).
- Register only the features you use to keep the bundle small (tree-shaking). `stockFeatures` is convenient but ships everything.

## Column Definitions

Use `createColumnHelper<typeof features, TData>()` (or `createAppColumnHelper<TData>` from `createTableHook`):

```tsx
const columnHelper = createColumnHelper<typeof features, User>();

const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => `${row.first} ${row.last}`, {
    id: "fullName",
    header: "Full name",
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => <RowActions row={row} />,
  }),
]);
```

Rules:

- `accessor` columns have a data model (sortable/filterable). `display` columns do not (actions, checkboxes). `group` columns nest other columns.
- Accessor functions returning computed values need a unique `id` (or string header).
- Accessor values should be **primitives** so built-in sort/filter work.
- `cell`/`header`/`footer`/`aggregatedCell` are the formatting hooks. Cell formatters receive `getValue()`, `row`, and `table`.
- Per-column feature options: `sortFn`, `filterFn`, `enableSorting`, etc. In v9 these names are typed from the registries in `tableFeatures`.

## Composition: `createTableHook`

Define shared features, row models, and defaults once, then build each table with columns/data:

```tsx
// src/hooks/table.tsx
const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns,
});

const { useAppTable, createAppColumnHelper } = createTableHook({
  features,
  debugTable: false,
  enableSortingRemoval: false,
});

export { useAppTable, createAppColumnHelper };
```

- `createAppColumnHelper<TData>()` is pre-bound to the features type — no `typeof features` threading.
- Column factories (from `02_architecture.md`) receive injected context (e.g. `currentUserId`) and return `createAppColumnHelper`-built columns.

## Client-Side vs Server-Side Row Processing

TanStack Table does not fetch data. Two modes:

- **Client-side**: register row models (`createSortedRowModel`, `createFilteredRowModel`, `createPaginatedRowModel`, ...). Best when the dataset fits reasonably in the browser (Table handles up to millions of rows). Immediate local interactions.
- **Server-side ("manual")**: the backend does filtering/sorting/pagination. Keep the feature (for state/APIs) but **omit the client-side row model** and enable `manualFiltering`/`manualSorting`/`manualPagination`.

Rule: when the server owns pagination, it should also own any filtering/sorting/grouping applied to the full dataset — client-side operations on a server page only process loaded rows.

### With TanStack Query (server-side)

Every server-owned state value goes into the query key and the query function; table state is controlled:

```tsx
const dataQuery = useQuery({
  queryKey: ["users", { sorting, globalFilter, pagination }],
  queryFn: () => fetchUsers({ sorting, globalFilter, pagination }),
  placeholderData: keepPreviousData,
});

const table = useTable(
  {
    features,
    columns,
    data: dataQuery.data?.rows ?? [],
    rowCount: dataQuery.data?.rowCount,
    state: { sorting, globalFilter, pagination },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((prev) => ({ ...prev, pageIndex: 0 })); // reset page on sort/filter change
    },
    onGlobalFilterChange: (updater) => {
      setGlobalFilter(updater);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
  },
  (state) => state,
);
```

- Pass `dataQuery.data?.rows ?? []` — only after a successful response; never hide a failed query as empty (see `05_ui_state_patterns.md`). Show `isPending`/`isError` before rendering the table.
- Use `keepPreviousData` + `isPlaceholderData` to avoid page-flicker and disable the Next button while stale (see `04` + Query `paginated-queries`).
- `getRowId` with a stable backend id when row selection/expansion must survive requests.
- Cursor pagination: `useInfiniteQuery` + `pagination.pageIndex` selecting cached pages (see Query infinite guide).

## State & Controlled Tables

- Read state via `table.state` / table atoms; mutate via setters (`setSorting`, `setPagination`, `setRowSelection`, ...) or controlled `state` + `on*Change` props.
- Controlled mode is required for server-side processing (state drives the query key).
- Render only visible rows; add virtualization (TanStack Virtual) for large lists (see the TanStack Virtual docs).

## Async UI States (mandatory)

Tables are async surfaces — follow `05_ui_state_patterns.md`:

- Loading: `<Skeleton>` (or a compact row-skeleton) with hardcoded layout.
- Error: `<Alert variant="destructive">` + `getErrorMessage(error, fallback)`.
- Empty: the shadcn `Empty` primitive (`@/components/ui/empty`) only after a valid empty response.
- Do not render an empty table (or `[]`) for a failed query.

## Key Rules / Anti-patterns

- ❌ Copying v8 examples (`useReactTable`, no `features`). v9 requires `useTable` + `tableFeatures`.
- ❌ Recreating `columns`/`features`/`data` on every render without memoization — causes re-processing/infinite loops.
- ❌ Querying inside cells or building columns that depend on another feature's query — use column factories with injected context (route/layout passes it in).
- ❌ Mixing client and server row processing for the same dataset (sort current page = misleading).
- ✅ `createTableHook` for shared features + `createAppColumnHelper` for type-safe columns.
- ✅ Keep `data` reference stable; control table state for server-side mode.