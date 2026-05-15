# Generate Commit Message

Generate a commit message for the changes currently staged (or modified
if nothing is staged) in this repository, following the convention
defined in [.cursor/rules/commit-message.mdc](.cursor/rules/commit-message.mdc).

## Steps

1. Run these in **parallel** to gather context:
   - `git status --short`
   - `git diff --staged` (if empty, fall back to `git diff`)
   - `git log -5 --pretty=format:"%s"` (so the new message matches the
     repo's prevailing tone)
2. Pick the conventional `type` from the change set:
   - `feat` for new user-visible behavior
   - `fix` for bug fixes
   - `refactor` for non-behavioral code changes
   - `chore` for tooling, deps, configs
   - `perf`, `docs`, `test`, `build`, `ci`, `style`, `revert` as
     appropriate
3. Pick a `scope` from the most-affected top-level feature folder
   (e.g. `src/features/calculations/...` -> `calculations`). Omit only
   if the change is genuinely cross-cutting.
4. Write the subject in imperative mood, max ~72 chars, no trailing
   period.
5. Write a short why-paragraph (1-3 sentences) followed by a
   bulleted list of the concrete logical changes (one bullet per
   logical edit, not per file). Wrap at ~72 chars. Reference symbols
   and files in backticks.

## Output

Reply with **only one fenced code block** containing the full message
(subject + blank line + body + blank line + bullets). Do not add any
prose before or after. Do not split the subject and body into separate
code blocks. Do not run `git commit` — only generate the text.

## Skip if no changes

If `git status --short` shows nothing, reply with a single line:
`No changes to commit.` and stop.
