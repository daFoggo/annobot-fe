# startcn-base Handbook

This folder is the canonical documentation set for the reusable base frontend architecture and development rules.

> Docs are written in **SKILL.md format** — each has a `name`/`description` frontmatter so agents can load the matching section as a playbook. Reference docs (`01`, `02`, `10`, ...) stay prose.
>
> This handbook documents **generic, reusable standards**. Project-specific content (a particular brand, page archetypes for one site, visual references) lives outside the base in `docs/project/`.

## Reading Order

| Order | Document | Purpose |
|---|---|---|
| 1 | `01_project_overview.md` | Product scope, frontend role, and tech stack |
| 2 | `02_architecture.md` | App architecture, feature boundaries, route orchestration |
| 3 | `03_feature_development.md` | How to build or refactor a feature module |
| 4 | `04_tanstack_start_query_router.md` | TanStack Start, Router, Query, SSR data rules + both data source patterns (Supabase & AnnoBot ky backend) |
| 5 | `05_ui_state_patterns.md` | Loading, error, empty, compact UI, and form action states |
| 6 | `06_quality_rules.md` | Consistency rules, checks, and review expectations |
| 7 | `07_development_checklist.md` | Practical development and review checklist |
| 8 | `08_zustand_best_practices.md` | Zustand client state management best practices & SSR rules |
| 9 | `09_i18n.md` | Locale routing and translation content organization |
| 10 | `10_design_tokens.md` | Generic design-token & styling rules (colors, typography, spacing, radius) |
| 11 | `11_tanstack_form.md` | TanStack Form patterns: validation, submission, `createFormHook` composition |
| 12 | `12_tanstack_table.md` | TanStack Table (v9) patterns: features/row models, columns, client vs server processing |
| 13 | `13_dashboard_shell.md` | Dashboard shell composition: layout regions, sub-sidebar (product menu) convention, page frames |

Project-specific references (not part of the base, per-project):

| Document | Purpose |
|---|---|
| `docs/design-system/typography-and-spacing.md` | Type scale, spacing, and dashboard layout standards |
| `docs/project/reference-styles.md` | Visual treatment reference for a specific site/brand |

## Mandatory Agent Rule Files

Automation agents and coding assistants should read `AGENTS.md` at the project root first, which points directly to this handbook.

## Core Decisions

- Feature modules own feature-local code; routes own cross-feature page composition.
- Feature components receive cross-feature data and actions through props/callbacks; routes or layout containers own those dependencies.
- `server.ts` is server-only and never exported from feature barrels.
- Query functions return valid data or throw. Failed queries are not empty states.
- Route loaders decide criticality: `queryClient.query()` awaited blocks, fire-and-forget warms cache.
- Critical data uses Suspense and route error boundaries.
- Optional widgets use local `useQuery` states.
- Two data sources, both accessed via feature `server.ts` + `functions.ts`: the AnnoBot HTTP backend through the shared `ky` instance (`src/lib/ky.ts`) and Supabase through the shared client (`src/utils/supabase.ts`). Neither client is called from `queries.ts` or components.
- Auth uses the AnnoBot backend: tokens live in a server session cookie, `ky` attaches the Bearer header and auto-refreshes on 401.
- Zustand is for synchronous client/transient UI state only; do not mirror server state in Zustand.
- Always use atomic selectors or `useShallow` with Zustand stores to prevent unnecessary re-renders.
- UI state handling is mandatory for every async UI surface.
- Compact UI is allowed only when full `Alert` or empty state would break layout flow.
- Submit-critical dependency queries must block actions while loading or errored.
