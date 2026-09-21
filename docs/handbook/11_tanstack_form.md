---
name: tanstack-form
description: Apply the canonical TanStack Form patterns. Use when building or reviewing forms, wiring validators, handling submission, or composing reusable field/form components. Covers form hooks (useAppForm), validation (Standard Schema/Zod), submission handling, SSR, and composition.
---

# TanStack Form Patterns

## When to Use

- Building any form (auth, profile, search, filter, settings).
- Adding validation (client or server-side) or async debounced checks.
- Composing reusable field/form components.

## Approved Stack

- `@tanstack/react-form` for form state, validation, and submission.
- **Zod** for Standard Schema validation (already in the stack).
- `createFormHook` for production forms (reduces boilerplate, keeps type safety).
- TanStack Query mutations for the actual submit call (see `04_tanstack_start_query_router.md`).

## Core Model

TanStack Form is headless and store-based. The form instance holds state; components subscribe via selectors.

- Form state lives in the form instance (not React state). `useForm`/`useAppForm` returns it.
- A `Field` maps one key of `defaultValues` to an input. Use `form.Field` or the pre-bound `form.AppField`.
- Reactive reads use `useSelector(form.store, (s) => s.values.x)` — never read the whole store.
- `field.state.meta` exposes `errors`, `errorMap`, `isValid`, `isValidating`, `isTouched`, `isDirty`, `isPristine`, `isBlurred`, `isDefaultValue`.
- `isDirty` is **persistent** in TanStack Form (stays dirty after reverting to default). Use `isDefaultValue` for non-persistent "changed from default" logic.
- `canSubmit` is `false` once the form is touched and any field is invalid. Combine with `isPristine` to block submit before interaction.

## Production Setup: `createFormHook`

Prefer `createFormHook` over raw `useForm` for app forms. It pre-binds reusable UI components and keeps names type-safe.

```tsx
// src/hooks/form-context.ts
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()
```

```tsx
// src/hooks/form.tsx
import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./form-context";
import { TextField } from "@/components/form/text-field";

const { useAppForm, withForm } = createFormHook({
  fieldComponents: { TextField },
  formComponents: {},
  fieldContext,
  formContext,
});

export { useAppForm, withForm };
```

```tsx
// Custom field component — bound via useFieldContext
import { useFieldContext } from "@/hooks/form-context";

export function TextField({ label }: { label: string }) {
  const field = useFieldContext<string>();
  return (
    <label>
      <span>{label}</span>
      <input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
    </label>
  );
}
```

Usage:

```tsx
const form = useAppForm({
  defaultValues: { email: "", name: "" },
  validators: { onChange: schema },
  onSubmit: async ({ value }) => { /* ... */ },
});

<form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
  <form.AppField name="email" children={(field) => <field.TextField label="Email" />} />
</form>
```

Rules:

- `createFormHookContexts()` is defined once at app level; `useFieldContext`/`useFormContext` must come from the same context module.
- Use `form.AppField` (bound) and `form.AppForm` (wraps form components).
- `withForm` splits big forms into pieces. Do **not** use `useTypedAppFormContext` (context fallback) unless `withForm` is impossible — it loses type safety.
- Component rendering and field name typos are caught at compile time.

## Validation

Validation can be field-level or form-level, sync or async, on `onChange`/`onBlur`/`onSubmit` (or the `Async` variants).

- Prefer **Standard Schema** (Zod) for declarative validation:

```tsx
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(13),
});

useAppForm({
  defaultValues: { email: "", age: 0 },
  validators: { onChange: schema },
});
```

- Or function validators returning `string | undefined` (or typed error objects):

```tsx
validators={{
  onChange: ({ value }) =>
    value.length < 3 ? "At least 3 characters" : undefined,
}}
```

- Async validators need debouncing: `asyncDebounceMs` on the field (default 500ms) or per-validator `onChangeAsyncDebounceMs`.
- Sync runs first; `Async` only runs if sync passes (unless `asyncAlways: true`).
- Form-level validators can return `{ form: "...", fields: { age: "..." } }` to set per-field errors (e.g. from a server check in `onSubmitAsync`).
- **Standard Schema validation does not transform values.** `onSubmit` receives the *input* shape; call `schema.parse(value)` inside `onSubmit` to get transformed output.

## Submission Handling

```tsx
useAppForm({
  defaultValues,
  onSubmitMeta: { action: "continue" },  // optional metadata for multi-action forms
  onSubmit: async ({ value, meta }) => {
    // value is the input shape (not schema output); parse if transformed
    await someMutationFn(value);          // call a mutation / server function
  },
});
```

- Use `onSubmitMeta` to distinguish submit intents (e.g. "save and continue" vs "save and exit"); `handleSubmit({ action })` overrides the default.
- Keep network side effects in the mutation / server function, not in the form component.
- Reset buttons: `type="button"` + `form.reset()` (avoid native `type="reset"` which resets DOM nodes unexpectedly).
- Disable submit via `form.Subscribe` on `[state.canSubmit, state.isSubmitting]` — prefer `aria-disabled` over `disabled` for accessibility.

## SSR / Client State Notes

- Form state is client-side transient UI state — do **not** mirror it in Zustand or Query. It lives in the form store.
- Persist draft values to localStorage only when explicitly needed, and guard with the hydration pattern from `08_zustand_best_practices.md` (`useHydrated`) to avoid SSR mismatches.
- Async initial values (`async-initial-values`) fetch into `defaultValues`; show a loading state until they resolve (see `05_ui_state_patterns.md`).

## Key Rules / Anti-patterns

- ❌ Reading the whole store (`useSelector(form.store)`) — causes re-renders. Always pass a selector.
- ❌ Using `useField` directly for reactivity in custom components — use `useSelector(form.store, ...)`.
- ❌ Relying on schema transform in `onSubmit` value — it is the input shape; parse explicitly.
- ❌ Building forms with raw `useForm` + inline fields everywhere — use `createFormHook` for reusable, type-safe composition.
- ✅ `AppField`/`AppForm` for production forms; `withForm` for large form decomposition.