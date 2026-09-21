# Tanstack Start base
Frontend web application base, built with **TanStack Start + React 19 + shadcn/ui + Tailwind CSS v4**, talking to the **AnnoBot HTTP backend (ky)** and **Supabase**.

## Prerequisites

| Tool | Minimum Version |
|---|---|
| Node.js | 22.x |
| pnpm | 9.x |

## Setup from Scratch

### 1. Install Node.js (if not already installed)

Check if Node.js is installed:

```bash
node --version
```

If not, install via one of the following:

**Windows (nvm-windows — recommended):**

```powershell
# Download and install nvm-windows from:
# https://github.com/coreybutler/nvm-windows/releases
nvm install 22
nvm use 22
```

**Windows (direct install):**

Download the LTS installer from https://nodejs.org.

**macOS / Linux (nvm):**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
# Close and reopen your terminal, then run:
nvm install 22
nvm use 22
```

### 2. Install pnpm

```bash
npm install -g pnpm
```

Verify:

```bash
pnpm --version
```

### 3. Clone & Install Dependencies



### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Fill in the values in `.env`:

```env
VITE_API_URL=http://localhost:40723/api/v1
SESSION_SECRET=a-long-random-secret-at-least-32-chars
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_KEY=sb_publishable_...
```

## Data Sources

The app talks to two backends, both accessed through feature `server.ts` + `functions.ts` (see `docs/handbook/04_tanstack_start_query_router.md` → "Two Data Source Patterns"):

- **AnnoBot HTTP backend** (`anno-bot-merge`, FastAPI at `http://localhost:40723/api/v1`) — primary data source, via the shared `ky` instance in `src/lib/ky.ts`. Auth tokens live in a server session cookie; `ky` attaches the Bearer header and auto-refreshes on 401.
- **Supabase** — database/auth/realtime, via the shared client in `src/utils/supabase.ts` (`VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY`).

### 5. Start the Dev Server

```bash
pnpm dev
```

Open http://localhost:3000.

## Common Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start dev server (port 3000) |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm test` | Run tests (Vitest) |
| `pnpm format` | Format code (Biome) |
| `pnpm check` | Check lint + format + imports (Biome) |
| `pnpm lint` | Lint code (Biome) |
| `pnpm check:fix` | Auto-fix lint + format + imports (Biome) |

## Quality Gate

Run these after larger changes or before merging (see `docs/handbook/06_quality_rules.md`):

```bash
pnpm check:fix
pnpm typecheck
pnpm build
```

## Tech Stack

| Layer | Technology |
|---|---|
| App framework | TanStack Start |
| Routing | TanStack Router |
| Server state | TanStack Query |
| Data sources | AnnoBot HTTP backend (ky) + Supabase |
| Validation | Zod |
| UI | React 19, shadcn/ui, Base UI |
| Styling | Tailwind CSS v4 |
| Icons | @tabler/icons-react |
| Testing | Vitest |
| Format/Lint | Biome |

## Documentation

All architecture docs, conventions, and checklists live in `docs/handbook/`.

| Document | Contents |
|---|---|
| [`docs/handbook/00_index.md`](docs/handbook/00_index.md) | Handbook index & overview |
| [`docs/handbook/01_project_overview.md`](docs/handbook/01_project_overview.md) | Project scope & tech stack |
| [`docs/handbook/02_architecture.md`](docs/handbook/02_architecture.md) | Feature-based architecture & route orchestration |
| [`docs/handbook/03_feature_development.md`](docs/handbook/03_feature_development.md) | Building & refactoring feature modules |
| [`docs/handbook/04_tanstack_start_query_router.md`](docs/handbook/04_tanstack_start_query_router.md) | TanStack Start, Router, Query, SSR + data source patterns |
| [`docs/handbook/05_ui_state_patterns.md`](docs/handbook/05_ui_state_patterns.md) | Loading, error, empty, & form action states |
| [`docs/handbook/06_quality_rules.md`](docs/handbook/06_quality_rules.md) | Consistency rules & review expectations |
| [`docs/handbook/07_development_checklist.md`](docs/handbook/07_development_checklist.md) | Dev & review checklist |

Design tokens live in [`docs/design-system/`](docs/design-system/).

Agent and automation tools should read [`AGENTS.md`](AGENTS.md) first.

## External Docs

- [TanStack Start](https://tanstack.com/start/latest/docs/framework/react/overview)
- [TanStack Router](https://tanstack.com/router/latest/docs/framework/react/overview)
- [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Supabase JS](https://supabase.com/docs/reference/javascript/)
- [shadcn/ui](https://ui.shadcn.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Base UI](https://base-ui.com/react/overview/quick-start)
- [Zod](https://zod.dev)
- [Tabler Icons](https://tabler.io/docs/quickstart/react)
