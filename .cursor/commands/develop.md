# Develop

Project-specific guidance for implementing features, fixes, and refactors in
this repository. Apply to the **current task** in this thread (including any
user message paired with this command).

This document is also enforced by the **always-on** rule
[`.cursor/rules/develop.mdc`](.cursor/rules/develop.mdc) — follow it in **Plan
mode** and implementation even when `/develop` is not invoked.

Also see: [drizzle-schema.mdc](.cursor/rules/drizzle-schema.mdc),
[commit-message.mdc](.cursor/rules/commit-message.mdc),
[color-palette.md](.cursor/docs/color-palette.md),
[/generate-commit-message](.cursor/commands/generate-commit-message.md).

## Never

- Manually create or edit Drizzle migration SQL files (see [drizzle-schema.mdc](.cursor/rules/drizzle-schema.mdc))
- Drive-by refactors, unrelated formatting, or “while I’m here” edits outside the task
- Add or bump npm dependencies unless the user asks or the task clearly requires it
- Add `"use client"` without need (hooks, browser APIs, or interactivity)
- Extract a helper used only once (unless it encodes a clear invariant — prefer inline)
- Add thin pass-through wrappers or speculative “framework” utilities
- Skip searching for existing patterns in `src/lib`, `src/server`, `src/language`, `src/components`
- Change a shared helper in a way that breaks existing callers (extend additively or add a sibling)
- Introduce server actions without an explicit request
- Run `git commit` or `db:*` scripts unless the user asks

## Workflow

1. **Understand** the task and success criteria.
2. **Discover** (mandatory) — search the codebase before writing new code (see below).
3. **Plan** a minimal change set; stay within task scope (plans must respect architecture and shadcn/ui above).
4. **Implement** in the correct layer (architecture below).
5. **Verify** — run `npm run check` when TypeScript or app code changed.
6. **Hand off DB** — if `schema.ts` changed, stop and tell the user to run `npm run db:generate` (they apply migrations). Do not run `db:*` unless asked.

## Discovery (mandatory)

Before adding helpers, routers, or components:

- Search `src/lib`, `src/server`, `src/components`, `src/language`, and similar features (routers, pages under `src/app/[lang]/`).
- Grep for existing utilities; **extend** rather than duplicate.
- When **extending** a shared helper: grep all usages; preserve behavior for every existing caller (additive params or a sibling function).

## Architecture

| Layer | Location | Notes |
|-------|----------|--------|
| Routes / UI | [`src/app/[lang]/`](src/app/[lang]) | Colocate route UI under `_components/` |
| Shared UI | [`src/components/ui/`](src/components/ui), [`src/lib/utils.ts`](src/lib/utils.ts) | shadcn/ui (see below) |
| API | [`src/server/api/routers/`](src/server/api/routers) | Register in [`root.ts`](src/server/api/root.ts) |
| Auth | [`src/server/better-auth/`](src/server/better-auth) | `protectedProcedure`, `getSession` — no ad-hoc auth |
| DB | [`src/server/db/schema.ts`](src/server/db/schema.ts) | Queries via `ctx.db`; see Drizzle below |
| Client data | [`src/trpc/react.tsx`](src/trpc/react.tsx), [`src/trpc/server.ts`](src/trpc/server.ts) | tRPC + React Query |
| i18n | [`src/language/`](src/language) | `LocaleSchema`, `useTranslation`, server `ts()` |
| Recipes | [`src/app/[lang]/recipes/`](src/app/[lang]/recipes), [`src/server/api/routers/recipe.ts`](src/server/api/routers/recipe.ts) | DB-backed CRUD via tRPC |

Backend path is **tRPC**, not server actions, unless explicitly requested.

## UI (shadcn/ui)

The app GUI is built on **[shadcn/ui](https://ui.shadcn.com)** (configured in
[`components.json`](components.json), style `base-nova`, Base UI primitives).

- **Use existing components** from [`src/components/ui/`](src/components/ui) —
  `Button`, `Input`, `Label`, `Select`, `Table`, `DropdownMenu`, etc.
- **Add new primitives** with the CLI, not hand-rolled copies:
  `npx shadcn@latest add <component>` (e.g. `select`, `dialog`, `form`).
- **Styling:** semantic tokens from [`src/styles/globals.css`](src/styles/globals.css)
  (`bg-background`, `text-primary`, `border-input`, …); brand mapping in
  [color-palette.md](.cursor/docs/color-palette.md). No ad-hoc hex in JSX.
- **Forms:** use shadcn `Select` (popover list), not native `<select>`, unless the
  user explicitly asks for HTML selects.
- **Links styled as buttons:** use `buttonVariants()` + `<Link>` / `<a>` — Base UI
  `Button` does not support `asChild` (see shadcn Button docs).
- **Icons:** `lucide-react` (per `components.json`).
- **Do not** add parallel UI kits or duplicate shadcn patterns under new folders.

## Next.js components

Default to **Server Components** in `src/app/**`. Add `"use client"` only when the file needs React hooks, browser-only APIs, or client-side interactivity. Do not mark pages/layouts client-only for a single hook — extract a small client child instead.

## Zod

- **tRPC:** `.input(z.object({ ... }))` on procedures — see [`post.ts`](src/server/api/routers/post.ts).
- **Env:** [`src/env.js`](src/env.js) + [`.env.example`](.env.example) for new variables.
- **Shared:** `FooSchema` + `z.infer<typeof FooSchema>` — see [`LocaleSchema`](src/language/i18n.config.ts).
- Colocate `schemas.ts` in a feature folder only when reused across procedures or components.

## Drizzle

- Edit only [`schema.ts`](src/server/db/schema.ts) and `relations`; follow existing `createTable` / `pgTable` patterns.
- Query via `ctx.db`; use `.where()` on `update` / `delete` ([`eslint-plugin-drizzle`](eslint.config.js)).
- **Never** hand-write migration SQL or edit `drizzle/` / `migrations/` (see [drizzle-schema.mdc](.cursor/rules/drizzle-schema.mdc)).
- After schema changes: user runs `npm run db:generate` and applies migrations themselves.

## Helpers and abstraction

**Default:** inline at the call site.

**Extract** a shared helper only when at least one applies:

- Used in 2+ places in this change, or clearly duplicates existing code
- Encodes a business/technical invariant (validation, auth, query safety)
- Removes substantial complexity from multiple call sites

**Do not extract** when:

- Only one call site and reuse is speculative
- The helper is a thin pass-through or rename
- It duplicates an existing util under a new name

**Prefer:** extend `src/lib/*`, colocated `schemas.ts`, or tRPC router modules — not new `utils2.ts` trees.

**When extending** an existing helper: grep usages; preserve all current callers; prefer optional params or a sibling function; if behavior is incompatible, add a new helper instead of breaking the old one.

## Brand & UI

Follow [color-palette.md](.cursor/docs/color-palette.md). In components use semantic
Tailwind tokens from `globals.css` (`bg-background`, `text-primary`, `bg-card`,
`text-muted-foreground`, etc.). Map palette changes in CSS variables only—avoid
ad-hoc hex in JSX. CTAs use `Button` default variant (`primary` = Nexelon Red).
Use named accent tokens (`ember`, `golden-spice`) for food/premium highlights.

## Auth & Google login

When implementing sign-in or session UI:

- **Config:** [`src/server/better-auth/config.ts`](src/server/better-auth/config.ts) —
  `socialProviders.google`, `baseURL`, `secret`; client in
  [`client.ts`](src/server/better-auth/client.ts). Use [`getSession`](src/server/better-auth/server.ts)
  on the server and `authClient` on the client. No server actions for auth.
- **Routes:** `/[lang]/login` (public), `/[lang]/home` (session required). Recipes at
  `/[lang]` stay public. Use [`localePath`](src/lib/seo-url.ts) for redirects and
  `callbackURL` (default locale `sk` has no URL prefix).
- **UI:** Server pages; small `"use client"` children only for `signIn.social` /
  `signOut`. Style with palette semantic tokens.
- **i18n:** `auth.*` keys in `src/language/lang/en.json` and `sk.json`; update
  [`langMaps.ts`](src/language/langMaps.ts) to match.
- **Env:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`,
  `NEXT_PUBLIC_SERVER_URL`. Google redirect URI:
  `{NEXT_PUBLIC_SERVER_URL}/api/auth/callback/google`.
- **DB:** Auth tables already in schema; do not hand-edit migrations. User runs
  `db:migrate` / `db:push` if needed—agent does not run `db:*` unless asked.

## Fix vs feature

- **Fix:** reproduce → root cause → smallest change in scope.
- **Feature:** discovery → schema (if needed) → tRPC router → UI → i18n keys → types.

## Scope and dependencies

- **Minimal diff** — only files required for the task.
- **No new npm packages** unless the user asks or the task clearly requires one.

## Verification and commits

- Run `npm run check` after code changes.
- Do not commit unless the user asks.
- For commit messages, follow [commit-message.mdc](.cursor/rules/commit-message.mdc) or use `/generate-commit-message`.

## When invoked without a task

Reply briefly that these constraints apply, then ask what to implement — or proceed immediately if the user already described the task in the same message.
