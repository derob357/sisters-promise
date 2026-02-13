# Prompt: Set Up Claude Code Efficiency Tools for Sister's Promise

## Context

Sister's Promise is a natural skincare e-commerce platform with:
- A web frontend of **12+ static HTML pages** (Bootstrap 5 + Material Kit 2) served by Express
- A single monolithic `server.js` (~3800 lines) containing ALL API routes
- A React Native mobile app in `SistersPromiseMobile/` (git submodule)
- MongoDB database via Mongoose
- Backend tests: `npm test` (63 tests), Mobile tests: `cd SistersPromiseMobile && npm test` (233 tests)

Every site-wide web change (nav items, script tags, meta tags, footer links) requires touching all 12 HTML files with correct relative paths. Deploying requires running tests for both repos, staging, committing, and pushing parent + submodule separately. These repetitive workflows burn time and tokens.

**Your job**: Implement the following efficiency tools using Claude Code's built-in features. Do NOT install external packages unless absolutely necessary. Read the Claude Code documentation (use the claude-code-guide agent or `/help`) to understand the exact configuration format before creating any files.

---

## 1. Custom Slash Commands

Create the following as `.claude/commands/` markdown files. Each file becomes a `/command-name` the user can invoke.

### `/deploy` — Test, Commit, and Push Everything

File: `.claude/commands/deploy.md`

Purpose: One command to test both repos, stage all changes, commit with a descriptive message, and push both the submodule and parent repo.

The command should:
1. Run `npm test` in the project root — expect 63 passing tests. If any fail, STOP and report.
2. Run `npm test` in `SistersPromiseMobile/` — expect 233 passing tests. If any fail, STOP and report.
3. Check `git status` in both the parent repo and `SistersPromiseMobile/` submodule.
4. If the submodule has changes:
   - Stage, commit (with a descriptive message), and push `SistersPromiseMobile/` first.
   - Then stage the updated submodule reference in the parent.
5. Stage all modified/new files in the parent repo (but warn about and skip `.env` files, credentials, or files >1MB).
6. Show a diff summary and draft a commit message based on the changes.
7. Ask the user to confirm the commit message before committing.
8. Commit and push the parent repo.
9. Report the final status with commit hashes.

### `/add-to-all-pages` — Bulk HTML Snippet Injection

File: `.claude/commands/add-to-all-pages.md`

Purpose: Apply an HTML snippet to all site pages, handling path differences between root (`index.html`) and `pages/*.html`.

Arguments: The user will describe what to add and where (e.g., "add `<script src="auth.js">` before `</body>`" or "add `<li id="foo"></li>` after the Contact nav link").

The command should:
1. Identify all HTML pages that are part of the live site. The current list:
   - Root: `index.html`
   - Pages: `pages/shop.html`, `pages/ingredients.html`, `pages/about-us.html`, `pages/contact.html`, `pages/product-detail.html`, `pages/order-success.html`, `pages/product-seamoss-aloe.html`, `pages/privacy-policy.html`, `pages/terms-conditions.html`, `pages/rewards.html`, `pages/sign-in.html`
2. For each file, determine the correct relative path prefix:
   - `index.html` uses `./assets/`, `./pages/`
   - `pages/*.html` uses `../assets/`, peer filenames for other pages
3. Apply the requested snippet to each file, adjusting paths as needed.
4. Report which files were modified and show a count.
5. Verify no duplicate insertions (check if the snippet already exists before adding).

### `/check-nav` — Verify Navbar Consistency

File: `.claude/commands/check-nav.md`

Purpose: Audit all pages to ensure the navbar menu order, links, and auth-nav-item are consistent.

The command should:
1. Read every HTML page listed above.
2. Extract the `<ul class="navbar-nav">` content from each.
3. Verify the menu order is: Home, Shop, Rewards, Ingredients, About, Contact, auth-nav-item.
4. Verify each page marks its own link as `active` and no others.
5. Verify all `href` values use correct relative paths.
6. Report any inconsistencies as a table: File | Issue | Expected | Found.

### `/refactor-routes` — Split server.js Into Route Modules

File: `.claude/commands/refactor-routes.md`

Purpose: Plan and execute splitting `server.js` into modular route files to reduce token usage and improve maintainability.

The command should:
1. Enter plan mode.
2. Read `server.js` and map every route group:
   - Product routes (`/api/products/*`)
   - Auth/User routes (`/api/users/*`)
   - Admin routes (`/api/admin/*`)
   - Rewards routes (`/api/rewards/*`)
   - Square/Checkout routes (`/api/square/*`, `/api/checkout`, `/api/create-checkout`)
   - Chat routes (`/api/chat/*`)
   - Email routes (`/api/email/*`)
   - Analytics routes (`/api/analytics/*`)
   - Contact route (`/api/contact`)
3. Propose a `routes/` directory structure where each file exports an Express Router.
4. Keep middleware setup (Helmet, CORS, rate limiters, body parsers) in `server.js`.
5. Keep `asyncHandler`, `sanitizeInput`, and shared utilities accessible to route files.
6. Ensure all 63 backend tests still pass after refactoring.
7. Present the plan for user approval before making any changes.

---

## 2. Hooks

Configure hooks in the project's `.claude/settings.json` (create it if it doesn't exist, or merge into existing). Hooks run shell commands in response to Claude Code events.

### Post-Edit Hook: Validate Nav Consistency on HTML Changes

When any `.html` file in the project root or `pages/` directory is edited, run a quick check that `auth-nav-item` exists in the file. This catches accidental removals.

```bash
# Hook script: .claude/hooks/check-auth-nav.sh
# Receives the edited file path as $1
# Exit 0 = pass, Exit 1 = block with message

FILE="$1"

# Only check HTML files in root or pages/
case "$FILE" in
  *.html)
    if grep -q 'id="auth-nav-item"' "$FILE" 2>/dev/null; then
      exit 0
    else
      # Check if this file should have a navbar (skip email templates, mockups, etc.)
      if grep -q 'navbar-nav' "$FILE" 2>/dev/null; then
        echo "WARNING: $FILE has a navbar but is missing id=\"auth-nav-item\". Did you forget to add it?"
        exit 0  # Warn but don't block
      fi
    fi
    ;;
esac
exit 0
```

### Post-Commit Hook: Submodule Reminder

After a git commit in the parent repo, check if `SistersPromiseMobile` has unpushed changes and remind the user.

```bash
# Hook script: .claude/hooks/check-submodule.sh
cd SistersPromiseMobile 2>/dev/null || exit 0
UNPUSHED=$(git log --oneline @{u}..HEAD 2>/dev/null | wc -l | tr -d ' ')
if [ "$UNPUSHED" -gt "0" ]; then
  echo "REMINDER: SistersPromiseMobile submodule has $UNPUSHED unpushed commit(s). Run 'cd SistersPromiseMobile && git push' or use /deploy."
fi
exit 0
```

**Important**: Read the Claude Code hooks documentation to understand the correct settings.json format for registering these hooks. The format may use `hooks` key with event types like `PostToolUse`, `PreToolUse`, etc. Make sure you use the documented format — do NOT guess.

---

## 3. MCP Server Configurations

Research and configure MCP servers that would benefit this project. Add configurations to `.claude/settings.json` under the `mcpServers` key.

### Filesystem MCP Server

Look into `@anthropic/mcp-filesystem` or `@modelcontextprotocol/server-filesystem` (check which is the current official package). This would provide bulk file operations.

Configure it with read/write access scoped to the project directory only:
```
Root: /Users/drob/Documents/SistersPromise
```

### Git MCP Server

Look into `@modelcontextprotocol/server-git` or similar. This would provide git operations as MCP tools, potentially simplifying the submodule workflow.

### MongoDB MCP Server (Optional)

Look into `@modelcontextprotocol/server-mongodb` or `mcp-mongo-server`. This would allow querying the database directly during development. If available, configure it to connect using the `MONGODB_URI` from `.env` (do NOT hardcode the connection string in settings).

**Important**: Before configuring any MCP server:
1. Use the claude-code-guide agent to check the current MCP server setup documentation.
2. Verify the package exists and is maintained (check npm or the MCP server registry).
3. Only configure servers that are officially supported or well-maintained community packages.
4. Test that the server starts successfully after configuration.

---

## 4. Update CLAUDE.md

After implementing the above, add a new section to the project's `CLAUDE.md` documenting:

### Custom Commands
| Command | Purpose |
|---------|---------|
| `/deploy` | Test both repos, commit, push submodule + parent |
| `/add-to-all-pages` | Bulk-inject HTML snippets across all 12 pages |
| `/check-nav` | Audit navbar consistency across all pages |
| `/refactor-routes` | Plan server.js → route modules split |

### Hooks
- Post-edit: Warns if auth-nav-item missing from edited HTML files with navbars
- Post-commit: Reminds about unpushed submodule commits

### MCP Servers
List whichever servers were successfully configured.

---

## Execution Order

1. **First**: Research Claude Code's current documentation for commands, hooks, and MCP server configuration formats. Use the claude-code-guide agent. Do NOT guess formats.
2. **Second**: Create the custom slash commands (`.claude/commands/*.md`).
3. **Third**: Create and register hooks (scripts + settings.json config).
4. **Fourth**: Research and configure MCP servers (only those that exist and work).
5. **Fifth**: Update CLAUDE.md with the new tools documentation.
6. **Sixth**: Test each command and hook to verify they work.

## Constraints

- Do NOT modify any existing application code (server.js, HTML pages, etc.) — this prompt is only about tooling.
- Do NOT install global npm packages without asking.
- Do NOT hardcode secrets, paths with usernames, or credentials in any config files.
- If a feature (like a specific MCP server) doesn't exist or isn't reliable, skip it and note why.
- Keep all tooling config within the `.claude/` directory structure.
