## Tech Stack

| Area | Technology |
|---|---|
| App framework | TanStack Start |
| Routing | TanStack Router |
| Server state | TanStack Query |
| Forms | TanStack Form |
| Tables | TanStack Table (v9) |
| Data sources | AnnoBot HTTP backend (ky) + Supabase (JS client) |
| Validation | Zod |
| Language | TypeScript 7 (native `tsc`) |
| UI | React 19, shadcn/ui, Base UI |
| Styling | Tailwind CSS v4 |
| Icons | @tabler/icons-react |
| Testing | Vitest |
| Formatting/linting | Biome |
| Build tooling | Vite |

## Data Sources

The app talks to two backends, both through feature `server.ts` + `functions.ts` (see `04_tanstack_start_query_router.md` → "Two Data Source Patterns"):

- **AnnoBot HTTP backend** (`anno-bot-merge`, FastAPI at `http://localhost:40723/api/v1`) — primary data source, accessed with the shared `ky` instance from `src/lib/ky.ts`.
- **Supabase** — database/auth/realtime, accessed with the shared client from `src/utils/supabase.ts`.

Never call either client directly from `queries.ts` or components.

## Environment

Client environment variables are validated in `src/configs/env.ts`.

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_KEY=sb_publishable_...
```

The Supabase client is created once in `src/utils/supabase.ts`.

## TypeScript 7 (Native) Setup

TypeScript 7's native Go compiler is used for `tsc --noEmit` (typecheck). TypeScript 7.0 does not ship a programmatic API yet, so the TS 6 API is kept alongside it via npm aliases:

```jsonc
"devDependencies": {
  "typescript": "npm:@typescript/typescript6@^6.0.2", // TS 6 API (tooling compatibility)
  "@typescript/native": "npm:typescript@^7.0.2"          // `tsc` binary (native)
}
```

- `tsc` -> native TypeScript 7 (fast typecheck).
- `tsc6` -> TypeScript 6 compatibility compiler (for comparison).
- `import "typescript"` -> resolves to the TS 6 API.

Linting/formatting is handled by Biome, which does not need the TypeScript API; the TS 6 alias is kept only for tooling that imports the TypeScript API programmatically.

### Migration to a single TypeScript 7 (when 7.1 ships)

When TypeScript 7.1 ships its stable programmatic API:

1. Set `"typescript"` back to `"^7.x"`.
2. Remove the `@typescript/native` and `@typescript/typescript6` aliases.
3. Run `pnpm install`, then verify `pnpm typecheck`, `pnpm check`, and `pnpm build` all pass from a clean install.

## External References

- TanStack Start: https://tanstack.com/start/latest/docs/framework/react/overview
- TanStack Router: https://tanstack.com/router/latest/docs/framework/react/overview
- TanStack Query: https://tanstack.com/query/latest/docs/framework/react/overview
- Supabase JS: https://supabase.com/docs/reference/javascript/
- Zod: https://zod.dev
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/docs
- Base UI: https://base-ui.com/react/overview/quick-start
- Tabler Icons: https://tabler.io/docs/quickstart/react
