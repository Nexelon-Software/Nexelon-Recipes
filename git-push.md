---
name: git-commit-rules
description: Rules and workflow for git commits and pushing to develop, then moving the matching StoryReader Trello card to Done
---

# Git Commit Rules

You are responsible for creating clean, structured, and professional git commits.

## Branch Rules

- NEVER commit directly to `main` or `master`
- ALWAYS work on and push to `develop`
- Before committing:
  1. Check current branch
  2. If not on `develop`, switch to `develop`
  3. Pull latest changes from remote develop
  4. IMPORTANT DO NOT SKIP: Ask user to confirm commit message
- After commit and push:
  1. Push changes to `origin develop`
  2. Find the matching card on the **StoryReader** Trello board and offer to move it to **Done** (see Trello section below)

Required workflow:

```bash
git checkout develop
git pull origin develop
```

After changes:

```bash
git add .
git commit -m "<type>: <description>"
git push origin develop
```

---

# Commit Message Style

Write for **people**, not only developers. Messages should be easy to scan in the git log and make sense to someone who does not know the codebase.

**Prefer:**
- Plain language and outcomes (what readers, admins, or the product gain)
- StoryReader terms: stories, chapters, reading, library, subscriptions, admin, notifications
- Short, natural sentences

**Avoid:**
- Jargon-heavy summaries (`refactor auth middleware`, `cron endpoint`, `optimize query in repository layer`)
- File names, class names, or stack details in the subject line unless unavoidable
- Generic one-word subjects (`update`, `fixes`, `changes`, `wip`)

Still use a **type prefix** (`feat`, `fix`, `chore`) so history stays sortable—but the text after it should read like a short release note, not a code review comment.

---

# Commit Message Format

Use two parts when the change is not trivial:

```text
<type>: <short, friendly summary>
What changed: <one or two sentences in plain language—who benefits and how>
```

**Subject line rules:**
- After `<type>:`, use normal sentence casing (capitalize the first word)
- Keep the subject under ~72 characters when possible
- Describe the **user-visible result** or **problem solved**, not the implementation

**Examples (good):**

```text
feat: Admin can set how many premium stories unlock each month
What changed: New settings tab in the admin panel. Readers get fresh premium content on a schedule without manual updates.

fix: Login no longer fails after returning from the sign-in page
What changed: Users who sign in and get redirected back can open the app normally instead of seeing an error.

chore: Updated app dependencies for security and stability
What changed: Routine maintenance; no change to how the app looks or works for users.
```

**Examples (avoid):**

```text
feat: add GET /api/v1/stories/unlock cron handler
fix: resolve null ref in AuthRedirectMiddleware
chore: bump eslint and refactor UserRepository
```

For very small, obvious changes, a single subject line is enough:

```text
fix: Story cover images load again on slow connections
```

---

# Allowed Commit Types

## feat:

New capability or meaningful improvement for users or admins.

```text
feat: Weekly free stories refresh automatically
feat: Easier way to pick stories from your wishlist
```

## fix:

Something was broken or confusing; this corrects it.

```text
fix: Playback continues after locking the phone
fix: Duplicate push notifications no longer sent
```

## chore:

Behind-the-scenes work—dependencies, tooling, refactors—with **no** intended user-facing change. Say so clearly in `What changed:` when relevant.

```text
chore: Cleaned up build scripts
What changed: Internal only; behavior for readers and admins is unchanged.
```

---

# Commit Quality Rules

- Always include `What changed:` for anything beyond a tiny one-line fix
- Focus on **why it matters** to users, admins, or the team
- Group related changes into a single commit
- Avoid committing unrelated modifications together
- Do NOT use vague messages: `update`, `fixes`, `changes`, `stuff`, `temp`, `wip`

---

# Safety Rules

Before committing:
- Review changed files
- Check for secrets/API keys
- Ensure build-breaking code is not committed
- Ensure `.env` files are not committed unless explicitly intended

Always review:

```bash
git status
git diff
```

before commit.

---

# Pull Request Mentality

Even when directly pushing to `develop`, commits should be:
- readable by non-engineers on the team
- reviewable
- production-quality
- confirmed by user before push

Write commits so a product owner could understand what shipped from the message alone.

---

# Trello — Move card to Done

After a successful push to `develop`, update the **StoryReader** board on Trello using the Trello MCP tools.

## Board and lists

| Board | List names (left to right) |
|-------|------------------------------|
| **StoryReader** | Bugs → Features → In Progress → **Done** → Possible future updates |

1. Use `set_active_board` with the StoryReader board (or `list_boards` and pick **StoryReader**).
2. Use `get_lists` to resolve list IDs for **In Progress**, **Features**, and **Done**.

Search for the matching card in **In Progress** first, then **Features** if nothing fits then **Bugs** if nothing fits.

## Finding the matching card

- Compare the completed work (commit message, changed files, conversation) to open cards on the board.
- Prefer cards whose title or description clearly match the work just shipped.
- If more than one card could match, or none is obvious, list the candidates (card title, list name, short link) and ask the user which one applies—or whether to skip Trello for this push.

## User confirmation (required)

**Do not move any card without explicit user confirmation.**

Before calling `move_card`, show the user:

- Card **title**
- Current **list** (e.g. In Progress, Features)
- Card **URL** (from `shortUrl` or `url`)
- Brief note on **why** you think it matches the commit

Ask clearly, for example: *“Is this the right card to mark Done?”*

Only after the user confirms (yes / correct / move it):

- Call `move_card` with that card’s `cardId` and the **Done** list’s `listId`.

If the user says no, asks for a different card, or wants to skip:

- Do not move anything; offer to search another list or wait for the correct card name.

## When not to move a card

- User says the work does not map to a Trello card
- Change is `chore` with no user-facing work and no linked card
- User declines or is unsure—never guess and move anyway

## Example flow

1. Push to `develop` succeeds.
2. Agent: “I found a card in In Progress: *Admin can set monthly premium story unlocks* — https://trello.com/c/… — This matches the commit about the admin configuration tab. Move it to Done?”
3. User: “Yes.”
4. Agent moves card to **Done** and confirms with the card link.
