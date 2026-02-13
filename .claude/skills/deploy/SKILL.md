---
name: deploy
description: Test both repos, commit, and push submodule + parent
argument-hint: [optional commit message]
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, AskUserQuestion
---

# Deploy — Test, Commit, and Push Everything

Run the full deploy pipeline for Sister's Promise. This handles the submodule-first workflow automatically.

## Steps

1. **Run backend tests**: Execute `npm test` in the project root. Expect 63 passing tests. If any fail, STOP immediately and report the failures. Do not proceed.

2. **Run mobile tests**: Execute `cd SistersPromiseMobile && npm test` in the SistersPromiseMobile directory. Expect 233 passing tests. If any fail, STOP immediately and report the failures. Do not proceed.

3. **Check submodule status**: Run `git status` inside `SistersPromiseMobile/`. If there are uncommitted or unpushed changes:
   - Stage all changes in the submodule (but skip `.env` files)
   - Draft a commit message describing the submodule changes
   - Commit and push the submodule
   - Then in the parent repo, stage the updated submodule reference

4. **Check parent repo status**: Run `git status` in the project root (never use `-uall` flag).
   - Identify all modified and untracked files
   - WARN and SKIP any `.env` files, credential files, or files larger than 1MB
   - Stage all appropriate files by name (do not use `git add -A` or `git add .`)

5. **Draft commit message**: Run `git diff --cached --stat` and `git log --oneline -5` to understand the changes and recent commit style. Draft a concise commit message summarizing the changes.

6. **User confirmation**: Show the user:
   - List of files to be committed
   - The proposed commit message
   - Ask them to confirm or modify the message using AskUserQuestion

7. **Commit and push**: Create the commit with the confirmed message (append `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`), then push to the remote.

8. **Report**: Show the final commit hash(es) and branch status for both repos.

If the user provided a commit message via `$ARGUMENTS`, use that as the starting draft instead of generating one.
