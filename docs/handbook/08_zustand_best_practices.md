---
name: zustand-best-practices
description: Apply the canonical Zustand client-state patterns. Use when adding or reviewing client UI state, feature stores, persisted stores, or SSR hydration. Covers the Query vs Zustand boundary, store structure, selectors, slices, and SSR rules.
---

# Zustand State Management Best Practices

## When to Use

- Adding client-only UI state (sidebars, modals, draft wizards, tool state).
- Choosing between Zustand, TanStack Query, router state, and `useState`.
- Persisting store state safely with SSR.

## State Boundary: When to use Zustand

In our architecture, choose the right tool for each state category:

| State Type | Primary Tool | Examples |
|---|---|---|
| **Server State** | **TanStack Query** | Database rows, user profiles, API responses, query cache invalidation |
| **URL State** | **TanStack Router** | Pagination, active tab, sort order, URL search filters, deep links |
| **Global/Client UI State** | **Zustand** | Sidebar open/collapsed, modal queue, notification drawer, audio/video player, canvas tool selection |
| **Feature Client State** | **Zustand** | Multi-step client draft wizards, interactive canvas/workspace tool state, transient batch selections |
| **Component Local State** | `useState` / `useReducer` | Dropdown open, hover states, isolated input focus |

> [!IMPORTANT]
> **Do not mirror Server State in Zustand.**
> All asynchronous data fetching, server caching, and optimistic mutations belong in TanStack Query (`queries.ts` / `functions.ts`). Zustand is exclusively for client-side synchronous UI state.

---

## 2. Store Structure & Feature Architecture

### File Placement

- **App-wide Client Stores**: place in `src/stores/` (e.g. `src/stores/ui-store.ts`).
- **Feature-scoped Client Stores**: place in `src/features/[feature]/store.ts` or `src/features/[feature]/stores/`.

```text
src/
|-- stores/
|   `-- ui-store.ts                  # App-wide UI state
`-- features/
    `-- chat/
        |-- store.ts                 # Feature-local client state
        |-- components/
        |-- queries.ts
        `-- index.ts                 # Re-export client-safe store hooks
```

### Feature Barrel Exports

Export only client-safe hooks and selectors from `index.ts`:

```ts
// src/features/chat/index.ts
export { useChatUIStore } from "./store"
export type { ChatDraftState } from "./store"
```

---

## 3. Creating Stores with TypeScript

### Standard Store Pattern

Define state and actions in separate TypeScript interfaces for clarity and maintainability:

```ts
import { create } from "zustand"

interface UIState {
  sidebarOpen: boolean
  activeModal: string | null
}

interface UIActions {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (modalId: string) => void
  closeModal: () => void
  reset: () => void
}

const initialState: UIState = {
  sidebarOpen: true,
  activeModal: null,
}

export const useUIStore = create<UIState & UIActions>()((set) => ({
  ...initialState,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
  reset: () => set(initialState),
}))
```

---

## 4. Slices Pattern for Large Stores

When a store grows large, break it down into modular slices using `StateCreator`:

```ts
// src/stores/slices/theme-slice.ts
import type { StateCreator } from "zustand"

export interface ThemeSlice {
  theme: "light" | "dark" | "system"
  setTheme: (theme: "light" | "dark" | "system") => void
}

export const createThemeSlice: StateCreator<
  ThemeSlice & LayoutSlice, // Combined store type
  [],
  [],
  ThemeSlice
> = (set) => ({
  theme: "system",
  setTheme: (theme) => set({ theme }),
})
```

```ts
// src/stores/slices/layout-slice.ts
import type { StateCreator } from "zustand"

export interface LayoutSlice {
  sidebarExpanded: boolean
  toggleSidebar: () => void
}

export const createLayoutSlice: StateCreator<
  ThemeSlice & LayoutSlice,
  [],
  [],
  LayoutSlice
> = (set) => ({
  sidebarExpanded: true,
  toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
})
```

Combine all slices into the root store:

```ts
// src/stores/app-store.ts
import { create } from "zustand"
import { createThemeSlice, type ThemeSlice } from "./slices/theme-slice"
import { createLayoutSlice, type LayoutSlice } from "./slices/layout-slice"

export type AppStore = ThemeSlice & LayoutSlice

export const useAppStore = create<AppStore>()((...a) => ({
  ...createThemeSlice(...a),
  ...createLayoutSlice(...a),
}))
```

> [!NOTE]
> Always apply middlewares (e.g. `persist`, `devtools`) to the **root combined store**, never inside individual slice creators.

---

## 5. Performance & Render Optimizations

### 1. Always Use Atomic Selectors

Avoid subscribing to the entire store object, which causes unnecessary re-renders:

```tsx
// ❌ WRONG: Re-renders on any store update
const { sidebarOpen, toggleSidebar } = useUIStore()

// ✅ CORRECT: Only re-renders when sidebarOpen changes
const sidebarOpen = useUIStore((state) => state.sidebarOpen)
const toggleSidebar = useUIStore((state) => state.toggleSidebar)
```

### 2. Prevent Re-renders with `useShallow`

When a selector returns a new object or array instance computed from state, wrap it in `useShallow` (`zustand/react/shallow`) to prevent infinite re-render cycles or unnecessary renders:

```tsx
import { useShallow } from "zustand/react/shallow"

function Component() {
  // ✅ Returns an object but only re-renders if keys/values shallowly change
  const { sidebarOpen, activeModal } = useUIStore(
    useShallow((state) => ({
      sidebarOpen: state.sidebarOpen,
      activeModal: state.activeModal,
    }))
  )

  return <div>{sidebarOpen ? "Open" : "Closed"}</div>
}
```

### 3. Module-level Actions ("No-store Actions")

For static actions that don't depend on React rendering, defining them outside the hook avoids hook subscriptions:

```ts
export const useEditorStore = create<EditorState>(() => ({
  zoom: 1,
  selectedTool: "pointer",
}))

// Standalone actions: can be called inside or outside React components
export const setZoom = (zoom: number) => useEditorStore.setState({ zoom })
export const resetEditor = () => useEditorStore.setState({ zoom: 1, selectedTool: "pointer" })
```

---

## 6. Immutable State & Complex Data Structures

### 1-Level Auto Merge vs Nested Updates

Zustand automatically shallow-merges the first level of state. For nested properties, spread manually or use Immer:

```ts
// Shallow update (1-level merge)
set({ sidebarOpen: false })

// Nested object update (manual spread)
set((state) => ({
  editorConfig: {
    ...state.editorConfig,
    grid: {
      ...state.editorConfig.grid,
      enabled: true,
    },
  },
}))

// Replace entire state (disable auto-merge)
set(newState, true)
```

### Map and Set Usage

Because Zustand relies on reference equality (`Object.is`), **always return a new instance** when updating `Map` or `Set`:

```ts
interface SelectionStore {
  selectedIds: Set<string>
  toggleSelection: (id: string) => void
  clearSelections: () => void
}

export const useSelectionStore = create<SelectionStore>()((set) => ({
  selectedIds: new Set<string>(),

  toggleSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return { selectedIds: next }
    }),

  clearSelections: () => set({ selectedIds: new Set<string>() }),
}))
```

---

## 7. SSR & Hydration in TanStack Start

### Safe Hydration with `persist`

When persisting store state to `localStorage`, the initial server render will use default state while the client will load persisted state, causing hydration mismatch warnings if rendered immediately.

Use the `useHydrated` helper hook pattern:

```ts
// src/hooks/use-hydrated.ts
import { useEffect, useState } from "react"

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  return hydrated
}
```

```tsx
// Consuming persisted store safely in UI
export function ThemeToggle() {
  const isHydrated = useHydrated()
  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)

  if (!isHydrated) {
    return <Skeleton className="h-9 w-9 rounded-md" />
  }

  return (
    <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme}
    </Button>
  )
}
```

### Request-isolated Stores with Context

If a store must be initialized per request or from route params/props (avoiding cross-request server leaks):

```tsx
// src/features/workspace/context.tsx
import { createContext, useContext, useRef, type ReactNode } from "react"
import { createStore, useStore } from "zustand"

interface WorkspaceStoreProps {
  workspaceId: string
  initialMode: "view" | "edit"
}

interface WorkspaceState extends WorkspaceStoreProps {
  mode: "view" | "edit"
  setMode: (mode: "view" | "edit") => void
}

type WorkspaceStore = ReturnType<typeof createWorkspaceStore>

const createWorkspaceStore = (initProps: WorkspaceStoreProps) =>
  createStore<WorkspaceState>()((set) => ({
    ...initProps,
    mode: initProps.initialMode,
    setMode: (mode) => set({ mode }),
  }))

const WorkspaceContext = createContext<WorkspaceStore | null>(null)

export function WorkspaceStoreProvider({
  children,
  ...props
}: WorkspaceStoreProps & { children: ReactNode }) {
  const storeRef = useRef<WorkspaceStore>(null)
  if (!storeRef.current) {
    storeRef.current = createWorkspaceStore(props)
  }

  return (
    <WorkspaceContext.Provider value={storeRef.current}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspaceStore<T>(selector: (state: WorkspaceState) => T): T {
  const store = useContext(WorkspaceContext)
  if (!store) {
    throw new Error("useWorkspaceStore must be used within WorkspaceStoreProvider")
  }
  return useStore(store, selector)
}
```

---

## 8. Resetting State & Testing

### Store Reset Pattern (Auth Logout & Account Switch)

When users sign out or switch accounts, reset global client stores alongside TanStack Query caches:

```ts
// src/stores/reset.ts
const resetters: Set<() => void> = new Set()

export const registerResetter = (resetFn: () => void) => {
  resetters.add(resetFn)
  return () => {
    resetters.delete(resetFn)
  }
}

export const resetAllStores = () => {
  for (const reset of resetters) {
    reset()
  }
}
```

Register store resetters upon store creation:

```ts
const initialState: UIState = { /* ... */ }

export const useUIStore = create<UIState & UIActions>()((set) => {
  registerResetter(() => set(initialState))
  return {
    ...initialState,
    /* actions */
  }
})
```

Call `resetAllStores()` in your auth sign-out flow. Pass the active client from `useQueryClient()` in the calling component — never a module-level singleton:

```ts
import { resetAllStores } from "@/stores/reset"
import { signOutFn } from "@/features/auth/functions"
import type { QueryClient } from "@tanstack/react-query"

export async function handleSignOut(queryClient: QueryClient) {
  await signOutFn() // server function xóa session cookie
  queryClient.clear()
  resetAllStores()
}
```

```tsx
// In the component that owns the sign-out action
import { useQueryClient } from "@tanstack/react-query"

function SignOutButton() {
  const queryClient = useQueryClient()
  return <Button onClick={() => handleSignOut(queryClient)}>Sign out</Button>
}
```

### Testing with Vitest

Reset store state before each test to ensure test isolation:

```ts
// src/stores/__tests__/ui-store.test.ts
import { describe, it, expect, beforeEach } from "vitest"
import { useUIStore } from "../ui-store"

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.getState().reset()
  })

  it("toggles sidebar", () => {
    expect(useUIStore.getState().sidebarOpen).toBe(true)
    useUIStore.getState().toggleSidebar()
    expect(useUIStore.getState().sidebarOpen).toBe(false)
  })
})
```

---

## 9. Summary: Key Rules & Anti-patterns

- ❌ **Anti-pattern**: Storing server fetch responses in Zustand.
  - ✅ **Rule**: Server state belongs in TanStack Query.
- ❌ **Anti-pattern**: Subscribing with destructuring (`const { a, b } = useStore()`).
  - ✅ **Rule**: Use atomic selectors (`useStore(s => s.a)`) or `useShallow`.
- ❌ **Anti-pattern**: Mutating `Map`, `Set`, or nested arrays directly inside `set()`.
  - ✅ **Rule**: Always construct new instances (`new Map()`, `new Set()`, `.slice()`).
- ❌ **Anti-pattern**: Rendering persisted localStorage values during initial SSR render.
  - ✅ **Rule**: Guard persisted state with `useHydrated` to prevent hydration mismatches.
- ❌ **Anti-pattern**: Exporting server logic or server modules from feature barrels.
  - ✅ **Rule**: Feature barrels (`index.ts`) must only export client-safe hooks and schemas.
