---
name: dashboard-shell
description: Compose the dashboard shell with the compound DashboardShell API. Use when adding a dashboard page, a section with a sub-sidebar (product menu) / sub-header, or a page-level header. Covers layout regions, product-menu declaration, page frames, and composition rules.
---

# Dashboard Shell

## When to Use

- Adding or restructuring a page under the dashboard shell.
- Adding a section that needs a sub-sidebar (product menu) and its own header.
- Choosing between the standard page frame and a full-bleed layout.

## Layout Regions

```text
┌───────────────────────────────────────────────┐
│ Header (full width)                           │
├─────────┬───────────────┬─────────────────────┤
│ Sidebar │ Product menu  │ Content             │
│ (lvl 1) │ (sub-sidebar) │ (the page)          │
└─────────┴───────────────┴─────────────────────┘
```

| Region | Part | Source |
|---|---|---|
| Header | `DashboardShell.Header` | props (`context`, `actions`) + shell context |
| Sidebar (level 1) | `DashboardShell.Sidebar` | `staticData.navItems` or `DASHBOARD_NAV` |
| Product menu (optional) | `DashboardShell.ProductMenu` | `staticData.productMenu` |
| Content | `DashboardShell.Content` | page children |

## Composition

```tsx
<DashboardShell.Provider user={user} isSigningOut={...} onSignOut={...}>
  <DashboardShell.Frame>
    <DashboardShell.Header context={<DashboardHeaderContext />} />
    <DashboardShell.Body>
      <DashboardShell.Sidebar />
      <DashboardShell.ProductMenu />
      <DashboardShell.Content>{children}</DashboardShell.Content>
    </DashboardShell.Body>
  </DashboardShell.Frame>
</DashboardShell.Provider>
```

Rules:

- `Provider` is the only place that owns shell state (user, product menu, mobile sheet). Parts read it with `useDashboardShell()`; never prop-drill.
- **Never hand-roll** a sidebar, `aside`, header, or product-menu frame — compose the parts.
- The shell is **generic**: sections declare data via `staticData`; the shell renders it.
- Active nav is derived from the URL (router), never stored in global state.

## Sub-sidebar (product menu) + its header

Declare on the section route (or its layout route):

```ts
staticData: {
  productMenu: {
    title: "Logs",
    badge: "Beta",             // optional
    component: LogsFilterMenu, // module-scope component — stable identity
  },
},
```

The shell then renders:

- Desktop: an `<aside>` (`w-64 border-r`) containing `ProductMenuBar.Root` → `Header` + `Body`.
- Mobile: `ProductMenuSheet` (left sheet), opened by `ProductMenuSheetTrigger` in the mobile header. Both read the shell context, so no boolean props are needed.

Conventions (so every sub-sidebar page looks the same):

- The sub-sidebar header is `ProductMenuBar.Header` (`min-h-12` + `border-b`), which aligns with the main header height. Do not change its height or hand-roll a header.
- `component` must be defined at module scope, not inline.
- The sub-sidebar owns section navigation/filters; the page body stays in `DashboardShell.Content`.
- Compose a standard sub-sidebar menu with `ProductMenuNav` + `ProductMenuSeparator`; a custom menu (e.g. filters) is its own component.

## Page frames

Everything inside `DashboardShell.Content` is the page. Use one of:

| Frame | Use for |
|---|---|
| `DashboardPage` (`size="default"`) | Standard page with a title header (title/description/icon/actions), centered column — settings, forms. |
| `DashboardPage` (`size="full"`) | Standard title header, full-width content — lists, cards. |
| Custom full-bleed | Data-dense pages (tables, explorers) that own their toolbar + scroll. Use `flex min-h-0 flex-1 flex-col`. |

`DashboardPage` is the only page-header primitive — do not hand-roll title/description/actions markup.

## Customizing width & spacing

Every part (`DashboardShell.Frame/Header/Body/Sidebar/ProductMenu/Content` and `DashboardPage`) accepts a `className`, merged with tailwind-merge — so a page can override locally without new props:

| Goal | How |
|---|---|
| Full-bleed content | `size="full"` or `className="max-w-none"` |
| Wider centered column | `<DashboardPage className="max-w-7xl">` |
| Narrower column (form) | `<DashboardPage className="max-w-3xl">` |
| Tighter side padding | `<DashboardPage className="px-4">` |
| Wider/narrower sub-sidebar | `<DashboardShell.ProductMenu className="w-72" />` |
| Custom content padding | `<DashboardShell.Content className="p-0">` |

Because these are the same semantic tokens, prefer overriding the existing utilities (`max-w-*`, `px-*`, `w-*`) rather than adding arbitrary values.

## Breadcrumb & header actions

The breadcrumb is data-driven from `staticData.breadcrumb`; it renders nothing at the root (header keeps only the logo). Routes that need extra controls next to the breadcrumb declare a **component** instead of hardcoding markup:

```ts
staticData: {
  breadcrumb: { getLabel: (loaderData) => loaderData?.title },
  breadcrumbActions: ExperimentBreadcrumbActions, // module-scope component
},
```

`DashboardBreadcrumb` itself is composition-friendly — it accepts `children`:

```tsx
<DashboardBreadcrumb>
  <ExperimentBreadcrumbActions />
</DashboardBreadcrumb>
```

Rules:

- The base breadcrumb renders only the crumbs; extra controls come in through children / `staticData.breadcrumbActions`.
- `getLabel(loaderData)` lets a crumb show a dynamic title (e.g. the experiment name).
- Actions must be module-scope components with stable identity.

## Anti-patterns

- ❌ A section importing another section's product-menu component to compose a page → put it in `staticData.productMenu`.
- ❌ Building your own `<aside>` for a sub-sidebar.
- ❌ Boolean props like `hasProductMenu` / `showSidebar` to switch layout → compose parts.
- ❌ Storing the active nav item in Zustand → derive it from the URL.
