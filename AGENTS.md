# AGENTS.md — Nexelon Recipes

I'm Sam. You're my agent. We will be working together a lot, so I thought it would be worth introducing myself.

I love to build. I focus on building complex things as simple as possible. I love to find ways to reduce complexity when solving problems.

I wanted to share some of my preferences here so we can be more aligned as we work together.

## What this is

Nexelon Recipes is a recipe app: create and edit recipes, browse public recipes, follow authors, and import or export recipes as JSON. Nutrition on a recipe can be filled from the CIQUAL / Frida food tables.

This is a single **Next.js** app (App Router, React 19), not a monorepo. Package manager is **npm**. Node 20+.

Stack already in the repo: **tRPC**, **Drizzle** + Postgres, **Better Auth**, **Tailwind**, **shadcn/ui**, **Zod**. Locales are `sk` (default, no URL prefix) and `en` under `src/app/[lang]`.

Implementation conventions live in [`.cursor/commands/develop.md`](.cursor/commands/develop.md). Follow that before writing code. Short version:

- UI from `src/components/ui/` (shadcn). Semantic Tailwind tokens. No new UI kit.
- API is tRPC routers in `src/server/api/routers/`, registered in `src/server/api/root.ts`. No server actions unless asked.
- DB changes only in `src/server/db/schema.ts`. Do not hand-edit migration SQL. Do not run `db:*` unless asked; tell the user to run `npm run db:generate`.
- After TypeScript or app changes, run `npm run check`.

**Coding preferences - general**

- Keep things simple. Channel "yagni" energy unless told otherwise.
- Typesafety is useful, take advantage of it.
- Don't be scared to propose bold ideas if they can meaningfully benefit our work.
- Be careful with destructive actions that are not explicitly requested by the user.
- Tests are good! Endless smoke tests, "regression tests" for feature deletions, etc, much less good. Tests should be focused, not slop.
- Comments are a great way to clarify functionality and how code is used. Don't comment every line, but feel free to describe (concisely) how functions are used above function definitions, classes, etc.
- Keep comments up to date! When making changes, it's important to keep things in sync.

**Coding preferences (Typescript focused)**

- `any` is the enemy. Inferred types are our friend. Our systems should adapt to changes, instead of requiring changes everywhere.
- If your TS code looks like a Python dev wrote it, it is bad TS code.
- Avoid one-line functions that are just casting wrappers.
- Write TypeScript in ways that Matt Pocock and Theo would be proud of.
- If not already specified in project, I generally like to use the following tech: NextJs, Tailwind, React, npm
- When building more complex web apps, I like to pull in Zustand, React Query, Better-auth, and zod

**Questions are read-only**

- A question is a request for an answer, not for changes. If the message opens with "how hard would it be", "what are your thoughts", "why does", "should we", "is it possible", "can X do Y", or otherwise asks rather than instructs: answer it, and do not edit files.
- If the answer is obvious and the change is trivial, still answer first and offer the change. Ask before making it.

**Match ceremony to the task**

- Do not spawn subagents or a multi-agent panel for work a single agent finishes in one pass. Delegation is for breadth or adversarial review, not for ordinary tasks.
- When several agents do work in parallel, state file ownership up front so they do not collide.

**Frontend UI**

- Prefer established UI from `src/components/ui/` over one-off markup when building or changing screens.
- Reuse existing buttons, inputs, layout, and feature components before introducing new shared components.
- Only add a new shared component when nothing in `src/components/` fits; match the patterns and styling already used there.
- If working within an existing screen, preserve its structure and visual language. Brand tokens are in `.cursor/docs/color-palette.md`.

**Blast radius**

- Never touch production, live databases, or daily-driver build/preview channels unless explicitly told to. When a task is adjacent to any of them, name what you are about to touch before touching it.

**Commit messages (Conventional Commits)**

Follow [`.cursor/rules/commit-message.mdc`](.cursor/rules/commit-message.mdc).

- Format: `type(scope): imperative summary` (aim <= 72 chars, no trailing period)
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `style`, `revert`
- Body: a short paragraph on why, then bullets of the concrete changes
- Do not commit unless asked

## Recipe JSON format

Export and import share one recipe document. The live copy is **`GET /api/recipes/format`** ([`src/app/api/recipes/format/route.ts`](src/app/api/recipes/format/route.ts)). It is plain JSON, built from the same helpers the app uses:

- single recipe file — `recipeInputToExportEnvelope` (`format`: `nexelon-recipe`)
- collection file — `recipeInputsToCollectionEnvelope` (`format`: `nexelon-recipes`)
- import — `parseRecipeJsonFile` (envelope, or a bare recipe object)

The sample that fills every field lives in [`src/server/api/routers/recipe/format-example.ts`](src/server/api/routers/recipe/format-example.ts) as `recipeFormatInput`. Schemas and enums live in [`src/server/api/routers/recipe/schemas.ts`](src/server/api/routers/recipe/schemas.ts).

**Whenever you change that shape, update `recipeFormatInput` in the same change** so the endpoint still shows the format the app writes and accepts. That includes:

- fields on `RecipeInputSchema` or `RecipeJsonEnvelopeSchema` (added, removed, renamed, or retyped), including optional ones
- enums: `RECIPE_CATEGORIES`, `RECIPE_DIFFICULTIES`, `RECIPE_VISIBILITIES`, `RECIPE_UNITS`
- what `recipeInputToExportEnvelope` or `recipeInputsToCollectionEnvelope` emits
- what `parseRecipeJsonFile` accepts

The sample must keep parsing with `RecipeJsonEnvelopeSchema`. Leave a field out of `recipeFormatInput` only when export itself leaves that field out.
