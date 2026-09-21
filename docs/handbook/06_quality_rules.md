---
name: quality-rules
description: Enforce UI consistency and safety rules. Use when writing or reviewing components, styling, primitives, composition, motion, or running project checks. Covers design tokens, primitive usage, compound components, and the standard verification commands.
---

# Quality Rules

## When to Use

- Writing or reviewing any UI code.
- Deciding whether to hand-roll a tag or use a primitive.
- Before finishing multi-file work (run the checks).

## Checks

Run these after larger changes or before merging:

```bash
pnpm check:fix
pnpm typecheck
pnpm build
```

Do not run expensive checks repeatedly for every tiny edit unless requested.

## Code Safety

- Do not use non-null assertions (`!`) to bypass types.
- Use guard clauses, optional chaining, and safe fallbacks.
- Custom `<button>` elements need explicit `type`.
- Do not use `window.confirm()`; use `AlertDialog`.
- Do not remove focus rings.
- Do not introduce hidden runtime assumptions for route params or query data.

## Styling Rules

Canonical token rules live in `10_design_tokens.md`. Summary:

- **Nghiêm cấm arbitrary custom values (`className-[...]`)**: tuyệt đối không dùng `w-[460px]`, `max-w-[400px]`, `text-[10px]`, `text-[11px]`, `p-[15px]`, `gap-[10px]`, `min-h-[500px]`, `z-[999]`.
- Dùng **semantic theme tokens** (`text-foreground`, `text-muted-foreground`, `bg-background`, `border-border`...) — không dùng màu raw (`#fff`, `rgb(...)`, `bg-[#...]`) và không dùng palette Tailwind gốc (`bg-zinc-900`, `text-zinc-300`) khi token tương đương đã tồn tại. Bất kỳ surface luôn-tối nào cũng dùng `bg-primary text-primary-foreground` (xem `10_design_tokens.md`).
- Chỉ dùng Tailwind default scale: font `text-xs`..`text-9xl` (tối thiểu `text-xs`), spacing 4px, `gap-*` thay cho `space-*`, `size-*` khi w = h.
- Không hardcode z-index.
- Chỉ dùng một thư viện icon duy nhất của project (`@tabler/icons-react` trong repo này).
- Không dùng `<Badge>` cho filter vì badge không có interactive state.

## Component Rules

- **Use existing primitives first.** Everything in `src/components/ui/` is the design system — check it before writing any UI markup. If the primitive exists, use it — do not re-create it.
- Prefer existing `@/components/ui` and `@/components/common` components.
- Place components by scope of reuse + domain coupling (`02_architecture.md` → Component Placement Rule): page-local views go in `routes/<area>/-components/`, cross-page feature views in `features/[f]/components/`, domain-agnostic app-wide UI in `components/common`. Promote a route-local component into a feature when it gains a second consumer.
- Add a new component only when existing components cannot be composed cleanly.
- Add `data-slot` only when the root will actually be targeted from outside the component: CSS selectors (`[data-slot="..."]`, `has-data-[slot=...]`, `in-data-[slot=...]`), or JS (`querySelector`/scroll-spy). Do not add it speculatively to every component — a `data-slot` that nothing references is dead weight. shadcn `@/components/ui` primitives already carry their own `data-slot`; leave those untouched.
- Components with two or more variants should use CVA.
- Icon-only buttons need `aria-label` or screen-reader text.
- Inputs must support default, focus, error, disabled, and readonly states.
- Use `aria-invalid` for error states.

### Primitive Usage (Buttons, Inputs, Controls)

**Mindset rule:** before writing a raw `<button>`, `<a>`, styled `<div>`, or `animate-pulse` markup, ask "does a component already exist for this?" If yes, use it. Hand-rolling a tag + classes when a primitive exists is the primary source of UI inconsistency. Choose the primitive, then pick its `variant` / `size` / type props to express intent — do not re-implement the component's built-in appearance.

- Do not restyle a default `Button` by overriding its radius (`rounded-full`), font size/weight (`text-xs`, `font-medium`), or padding (`px-4`). The primitive's default IS the design system. `<Button>Label</Button>` and `<Button variant="outline">Label</Button>` should be the norm.
- `className` on a primitive is only for:
  - **Layout** overrides: `w-full`, `mt-2`, `gap-2`, alignment.
  - **Theme-necessitated** overrides: colors that must stay constant across light/dark (e.g. a white CTA on an always-dark marketing card). Prefer reusing existing tokens (`bg-white`, `text-zinc-950`) over re-styling shape/typography.
- Do not hand-roll a styled `<button>` pill for search, language, or icon controls. Compose existing primitives instead:
  - Search field → `InputGroup` + `InputGroupInput` + `InputGroupAddon`/`InputGroupButton`.
  - Language / menu trigger → `DropdownMenuTrigger` with `render={<Button variant="outline" />}`.
  - Icon-only control → `Button variant="ghost" size="icon-sm"`.
- Internal navigation must not use a raw `<a>` as a button. Use `Button render={<Link to="..." />} nativeButton={false}` (TanStack Router `Link`). External links keep a real `<a>`.
- Custom `<button>` elements are allowed only for genuinely bespoke controls that primitives cannot express; they still need explicit `type`, focus styles, and `aria-label`.

### Compound Component Rules (Vercel Composition, Minimal)

Compound components (`Object.assign(Comp, { SubComp })`) are only justified when callers genuinely compose the sub-parts in more than one way (e.g. `AppNavbar.Root/.Brand/.Nav/.Actions`, `HomeHero.Root/.Title/.Row/.Description`).

- Do NOT create a `Root`/`Header`/`Card`/`Item`/`Preset` compound for a section that is only ever rendered as one unit. Export a single component instead.
- Keep large internal visual blocks as private (non-exported) helper functions in the same file when that improves readability.
- Do not thread `className` + `...props` through internal wrappers that never receive them. Props exist only when a caller actually passes them.
- Do not export a `Preset` that duplicates the component itself.
- Reassess a compound component when its sub-parts stop being used in composition; collapse it back to a single component.

## Motion Rules

- Animate transform, opacity, and color.
- Do not animate width, height, or padding.
- Respect reduced motion with `motion-safe:` and `motion-reduce:`.
- Use existing Tailwind/tw-animate-css utilities before adding custom keyframes.

## Review Rules

When reviewing code, prioritize:

1. Runtime bugs and user-visible regressions.
2. Query/data correctness.
3. Error handling and SSR safety.
4. Missing loading/error/empty states.
5. Cache invalidation and mutation side effects.
6. Accessibility and design-system violations.
7. Test or verification gaps.
8. **Encoding integrity** — scan source files for mojibake (`â€¦`, `â€”`, `Ã©`, `báº±ng`, …) after any shell/batch edit. Corrupted UTF-8 silently breaks UI copy and comments. Fix with the edit tool, never with `Set-Content`/`Out-File` in PowerShell (they re-encode by default).

## Documentation Rules

- Update handbook docs when a repeated pattern or project-wide rule changes.
- Keep `AGENTS.md` as an entry point, not as the full detailed manual.
