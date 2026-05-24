---
name: git-commit-rules
description: Rules and workflow for git commits and pushing to develop
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
- Plain language and outcomes (what users, admins, or stakeholders gain)
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
feat: Admins can configure limits from the settings page
What changed: New settings section in the admin area. Scheduled updates apply automatically without manual work.

fix: Sign-in works after returning from the login redirect
What changed: Users who authenticate and land back in the app can continue normally instead of seeing an error.

chore: Updated dependencies for security and stability
What changed: Routine maintenance; no intended change to how the app looks or works for users.
```

**Examples (avoid):**

```text
feat: add GET /api/v1/items/unlock cron handler
fix: resolve null ref in AuthRedirectMiddleware
chore: bump eslint and refactor UserRepository
```

For very small, obvious changes, a single subject line is enough:

```text
fix: Images load again on slow connections
```

---

# Allowed Commit Types

## feat:

New capability or meaningful improvement for users or admins.

```text
feat: Scheduled updates run without manual intervention
feat: Easier way to add items to a personal list
```

## fix:

Something was broken or confusing; this corrects it.

```text
fix: App state is preserved when the device is locked
fix: Duplicate notifications are no longer sent
```

## chore:

Behind-the-scenes work—dependencies, tooling, refactors—with **no** intended user-facing change. Say so clearly in `What changed:` when relevant.

```text
chore: Cleaned up build scripts
What changed: Internal only; behavior for users and admins is unchanged.
```

---

# Commit Quality Rules

- Always include `What changed:` for anything beyond a tiny one-line fix
- Focus on **why it matters** to users, admins, or stakeholders
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
