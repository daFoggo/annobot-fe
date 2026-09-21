# Typography & Spacing Standards

> Standard typography and spacing guidelines for startcn-base, referenced from shadcn/ui base typography and Supabase layout analysis.
> Focused exclusively on two areas: **Typography** and **Spacing**. Other aspects (color, shadow, motion) are documented separately.

---

## 1. Typography

### Font Stack

The project comes preconfigured with 3 font variables:

| Token | Font | Used for |
|-------|------|----------|
| `--font-sans` | Geist Variable | Body, heading, UI text |
| `--font-mono` | Geist Mono Variable | Code, data values, IDs, timestamps |
| `--font-logo` | Funnel Display Variable | Brand logo only |

**Rules:**

- Dashboards predominantly use `font-sans`.
- Only use `font-mono` for: IDs, connection strings, database column types, log timestamps, and metric values.
- Do not use `font-logo` anywhere except the app logo.

### Type Scale

Use **Tailwind default font sizes** only; do not use arbitrary values.

| Token | Tailwind class | Size | Line Height | Weight | Tracking | Used for |
|-------|---------------|------|-------------|--------|----------|----------|
| `display` | `text-4xl` | 36px | 1.1 | 700 (bold) | `tracking-tighter` | Empty state hero |
| `page-title` | `text-3xl` | 30px | 1.2 | 600 (semibold) | `tracking-tight` | Page title |
| `section-title` | `text-xl` | 20px | 1.3 | 600 (semibold) | `tracking-tight` | Section title |
| `card-title` | `text-base` | 16px | 1.4 | 600 (semibold) | — | Organization, project, or table name |
| `body` | `text-sm` | 14px | 1.5 | 400 (normal) | — | Description, metadata |
| `body-sm` | `text-sm` | 14px | 1.5 | 400 (normal) | — | Secondary text, hint |
| `label` | `text-xs` | 12px | 1.4 | 500 (medium) | — | Form label, sidebar group label |
| `caption` | `text-xs` | 12px | 1.3 | 500 (medium) | `uppercase tracking-wider` | Badge, tag |
| `data` | `text-xs` | 12px | 1.4 | 400 (normal) | — | Code/data with `font-mono` |

### Specific Usage Rules

#### Headings

```tsx
// Page title — top of page, only one per page
<h1 className="text-3xl font-semibold tracking-tight">

// Section title — major content grouping
<h2 className="text-xl font-semibold tracking-tight">

// Card title — item name in list/grid
<h3 className="text-base font-semibold">
```

#### Body & Meta

```tsx
// Primary description/meta
<p className="text-sm text-muted-foreground">

// Secondary description, hint (same size but muted)
<p className="text-sm text-muted-foreground/70">

// Data values
<code className="font-mono text-xs">
```

#### Labels & Badges

```tsx
// Sidebar group label: "DATABASE MANAGEMENT", "CONFIGURATION"
<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">

// Badge/Tag: "FREE", "PRODUCTION", "BETA", "NEW"
<span className="text-xs font-medium uppercase tracking-wider">
```

### Color & Contrast

| Role | Light mode | Dark mode |
|------|------------|-----------|
| Primary text | `foreground` | `foreground` |
| Secondary text | `muted-foreground` | `muted-foreground` |
| Active/selected | `foreground` | `foreground` |
| Disabled | `muted-foreground` with `opacity-50` | `muted-foreground` with `opacity-50` |

### Prohibited Patterns

- Do not use `font-thin` (100) for UI text.
- Do not use `font-black` (900) in dashboards.
- Do not use more than 2 fonts within the same dashboard screen.
- Do not use `italic` for UI text.
- **Strictly prohibited: font sizes smaller than `text-xs` (12px).** `text-xs` is the lower boundary; never use arbitrary values like `text-[11px]`, `text-[10px]`, `text-[0.625rem]`.

---

## 2. Spacing

### Base Spacing Scale

| Token | Value | Used for |
|-------|-------|----------|
| `space-1` | 4px | Icon gap, badge padding |
| `space-2` | 8px | Tight gap inside components |
| `space-3` | 12px | Gap between elements inside cards |
| `space-4` | 16px | Card padding, standard section gap |
| `space-5` | 20px | Slightly larger card padding |
| `space-6` | 24px | Gap between page title and content |
| `space-8` | 32px | Page padding |
| `space-10` | 40px | Wide screen page padding |
| `space-12` | 48px | Large section spacing |
| `space-16` | 64px | Marketing/empty state spacing |

### Dashboard Layout Spacing

Based on analysis of Supabase design patterns, strictly using pure **Tailwind spacing classes**.

| Location | Tailwind class | Value | Notes |
|----------|---------------|-------|-------|
| Topbar height | `h-14` | 56px | Fixed height |
| Primary sidebar width | `w-64` | 256px | Expanded |
| Primary sidebar width (collapsed) | `w-12` | 48px | Icon only |
| Secondary sidebar width | `w-72` | 288px | Sub-navigation |
| Page padding | `p-8` | 32px | Default |
| Page padding (wide ≥1440px) | `p-10` | 40px | Slightly increased on large screens |
| Gap title → toolbar | `gap-6` | 24px | |
| Gap toolbar → content | `gap-4` | 16px | |
| Gap between cards | `gap-4` | 16px | Grid gap |
| Card padding | `p-4` | 16px | Standard |
| Card padding (compact) | `p-3` | 12px | High information density |
| Sidebar item height | `h-9` | 36px | |
| Sidebar item padding-x | `px-3` | 12px | |
| Toolbar item gap | `gap-3` | 12px | Between search, filter, sort, action |

### Spacing Patterns

#### Page Layout

```tsx
// Main content wrapper
<main className="flex-1 p-8">
  <div className="mx-auto max-w-7xl">
    {/* page content */}
  </div>
</main>
```

#### Section Stack

```tsx
<section className="flex flex-col gap-6">
  <h2 className="text-xl font-semibold tracking-tight">Section Title</h2>
  <div className="flex flex-col gap-4">
    {/* content */}
  </div>
</section>
```

#### Toolbar

```tsx
<div className="flex items-center justify-between gap-4">
  <div className="flex items-center gap-3">
    <SearchInput />
    <FilterDropdown />
    <SortDropdown />
  </div>
  <PrimaryActionButton />
</div>
```

#### Card Grid

```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <Card />
  <Card />
  <Card />
</div>
```

### Z-Index Layers

| Layer | z-index | Used for |
|-------|---------|----------|
| Background | 0 | Page background |
| Content | 10 | Cards, tables |
| Sticky | 20 | Sticky table header |
| Topbar | 30 | Fixed topbar |
| Sidebar | 40 | Fixed sidebar |
| Overlay | 50 | Sheet, modal, command palette |
| Tooltip | 60 | Tooltip, popover |

---

## 3. Code Implementation

### Reference Tailwind Classes

```tsx
// Page title
<h1 className="text-3xl font-semibold tracking-tight text-foreground">

// Section title
<h2 className="text-xl font-semibold tracking-tight text-foreground">

// Card title
<h3 className="text-base font-semibold text-foreground">

// Body text / description
<p className="text-sm text-muted-foreground">

// Sidebar group label
<span className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">

// Badge
<span className="text-xs font-medium uppercase tracking-wider">

// Keyboard shortcut
<kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs font-medium">Ctrl K</kbd>
```

### CSS Variables (if extension is needed later)

```css
:root {
  --dashboard-topbar-height: 3.5rem;          /* h-14 */
  --dashboard-sidebar-width: 16rem;           /* w-64 */
  --dashboard-sidebar-width-collapsed: 3rem;  /* w-12 */
  --dashboard-secondary-sidebar-width: 18rem; /* w-72 */
  --dashboard-page-padding: 2rem;             /* p-8 */
}
```

Prioritize using Tailwind utility classes directly. CSS variables should only be used when complex layout calculations or cross-component sharing are necessary.

---

## 4. UI Development Checklist

- [ ] Page title strictly uses `text-3xl font-semibold tracking-tight`.
- [ ] Body text defaults to `text-sm`.
- [ ] Secondary text always uses `text-muted-foreground`.
- [ ] Badge/tag uses `text-xs font-medium uppercase tracking-wider`.
- [ ] **No font size smaller than `text-xs` (12px).** Never use `text-[11px]`, `text-[10px]`, `text-[0.625rem]`.
- [ ] Card padding defaults to `p-4`.
- [ ] Gap between cards defaults to `gap-4`.
- [ ] Page padding defaults to `p-8`.
- [ ] Do not use arbitrary spacing outside the defined scale.
- [ ] Prioritize built-in Tailwind classes, avoiding arbitrary values like `text-[...]`, `w-[...rem]`.

