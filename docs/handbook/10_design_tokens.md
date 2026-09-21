---
name: design-tokens
description: Apply the canonical design-token and styling rules. Use when writing or reviewing any styling — color, typography, spacing, radius, icons, motion. Covers the semantic theme tokens, the Tailwind default scale, and banned patterns.
---

# Design Tokens & Styling

## When to Use

- Writing any `className` / styling.
- Choosing a color, font, size, spacing, or radius.
- Reviewing UI for token consistency.

## Principles

1. Use **semantic theme tokens** — never raw colors or raw Tailwind palette colors.
2. Use the **Tailwind default scale** — never arbitrary values.
3. Use existing primitives as-is (see `06_quality_rules.md`).

## Colors

Semantic theme tokens are defined in `src/styles.css` (shadcn-style `oklch` tokens):

| Family | Tokens | Use for |
|---|---|---|
| Theme (light/dark) | `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-1..5`, `sidebar-*` | All UI |

Rules:

- Use standard theme classes — `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-muted`, `border-border`, `bg-primary` ... — never `#hex`, `rgb(...)`, `bg-[#...]`, or raw Tailwind palette (`bg-zinc-900`, `text-zinc-300`).
- Adjust intensity with the `/xx` opacity syntax: `text-muted-foreground/70`, `bg-background/80`, `text-foreground/30`.
- A component should be theme-agnostic by default: it uses semantic tokens so it adapts automatically to light/dark and to any brand remap. Reserve one-off color overrides for genuinely theme-necessitated cases (e.g. a surface that must stay constant across modes).
- Never hardcode z-index; rely on the Tailwind stack (`z-10`…`z-50`) and primitive internals.

## Typography

Font tokens are defined in `src/styles.css`:

| Token | Use |
|---|---|
| `--font-sans` | Body, UI text, default headings |
| `--font-mono` | Numbers, data, code, timestamps, IDs |
| `--font-heading` | Optional display/heading face |
| `--font-logo` | Brand logo only (Funnel Display Variable) |

Rules:

- Tailwind default scale only: `text-xs`..`text-9xl`; minimum is `text-xs` (12px).
- No arbitrary `text-[...]`.
- `font-normal` (400) / `font-medium` (500) / `font-semibold` (600) / `font-bold` (700).
- Note: shadcn primitives may carry internal arbitrary values (e.g. `text-[0.8rem]`); project code must not.
- Brand-specific font families (which face maps to `--font-sans`/`--font-heading`/`--font-logo`) are a project decision, not a base rule.

## Spacing

- Tailwind default 4px scale: `0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, ...`
- Prefer `gap-*` on flex/grid over `space-x/y-*`.
- No arbitrary values (`w-[460px]`, `p-[15px]`, `min-h-[500px]`).
- Use `size-*` when width and height match (`size-4`, not `w-4 h-4`).

## Radius

Radius is driven by the `--radius` token in `src/styles.css` (overrides the rounded scale).

**Primitives tự định hình radius sẵn — không cần tự làm round lại:**

| Primitive | Radius mặc định |
|---|---|
| `Button` | `rounded-lg` |
| `Card` | `rounded-xl` |
| `Input`, `Textarea`, `Select` | `rounded-lg` |
| `Badge` | `rounded-4xl` (pill) |
| `Avatar` | `rounded-full` |

Rules:

- Chỉ cần **sử dụng primitives sẵn có** — mọi surface, pill, avatar, badge đều đã có radius đúng. Không thêm `rounded-*` vào primitives đã định hình shape.
- Dùng **`Badge`** cho mọi pill/tag/label. Không chế lại component pill riêng bằng `span` + class tự viết — `Badge` đã có variant (`default`/`secondary`/`destructive`/`outline`/`ghost`/`link`) và các trạng thái (hover, focus ring, destructive, icon) sẵn.
- `rounded-full` chỉ dùng cho trường hợp thật sự cần hình tròn ngoài primitives (ví dụ một shape custom đặc biệt); avatars và badges không nằm trong nhóm này vì đã có sẵn.
- The actual radius value (square vs soft) is a brand/project decision, not a base rule.

## Icons

- Use the project icon library only (one library, no mixing).
- Icons inside primitives use `data-icon="inline-start|inline-end"`; no sizing classes on icons inside components.

## Motion

- Animate `transform`, `opacity`, `color` only.
- Use `tw-animate-css` / Tailwind utilities before custom keyframes.
- Respect reduced motion with `motion-safe:` / `motion-reduce:`.

## Banned Patterns

- Arbitrary class values (`text-[10px]`, `w-[450px]`, `p-[15px]`, `min-h-[500px]`, `z-[999]`).
- Hardcoded colors (`#fff`, `rgb(...)`, `bg-[#...]`).
- Raw Tailwind palette colors when a theme token exists (`zinc-*`, `slate-*`, ...).
- `space-x/y-*` when `gap-*` works.
- Manual `dark:` overrides when semantic tokens already adapt.
- Custom keyframes when built-in utilities suffice.