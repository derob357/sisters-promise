---
name: check-nav
description: Audit navbar consistency across all site pages
user-invocable: true
allowed-tools: Read, Grep, Glob
---

# Check Nav — Verify Navbar Consistency

Audit all Sister's Promise site pages to ensure the navbar menu order, links, active states, and auth-nav-item are consistent.

## Expected Navbar Structure

The correct menu order (left to right) across all pages:

1. **Home** — links to `index.html` (root) or `../index.html` (pages/)
2. **Shop** — links to `./pages/shop.html` (root) or `shop.html` (pages/)
3. **Rewards** — links to `./pages/rewards.html` (root) or `rewards.html` (pages/)
4. **Ingredients** — links to `./pages/ingredients.html` (root) or `ingredients.html` (pages/)
5. **About** — links to `./pages/about-us.html` (root) or `about-us.html` (pages/)
6. **Contact** — links to `./pages/contact.html` (root) or `contact.html` (pages/)
7. **Auth nav item** — `<li class="nav-item" id="auth-nav-item"></li>`

## Pages to Check

- `index.html`
- `pages/shop.html`
- `pages/ingredients.html`
- `pages/about-us.html`
- `pages/contact.html`
- `pages/product-detail.html`
- `pages/order-success.html`
- `pages/product-seamoss-aloe.html`
- `pages/privacy-policy.html`
- `pages/terms-conditions.html`
- `pages/rewards.html`
- `pages/sign-in.html`

## Checks to Perform

For each page:

1. **Menu order**: Extract nav items from `<ul class="navbar-nav">`. Verify they appear in the order listed above.

2. **Active state**: Verify the page marks its OWN nav link with `class="nav-link active"` and no other link has `active`.
   - `index.html` → Home should be active
   - `pages/shop.html` → Shop should be active
   - `pages/rewards.html` → Rewards should be active
   - `pages/ingredients.html` → Ingredients should be active
   - `pages/about-us.html` → About should be active
   - `pages/contact.html` → Contact should be active
   - Other pages (product-detail, order-success, etc.) → NO link should be active (or their parent category)

3. **Correct hrefs**: Verify all link paths are correct for the file's location:
   - Root files use `./pages/` prefix
   - Pages files use peer filenames (no prefix) for other pages, `../index.html` for Home

4. **Auth nav item**: Verify `<li class="nav-item" id="auth-nav-item"></li>` exists and is the LAST item in the nav list.

5. **Auth.js script**: Verify `<script src="[path]/auth.js"></script>` exists before `</body>`.

## Output Format

Report results as a table:

```
| File | Menu Order | Active State | Hrefs | Auth Item | Auth Script | Issues |
|------|-----------|-------------|-------|-----------|-------------|--------|
| index.html | OK | OK | OK | OK | OK | None |
| pages/shop.html | OK | OK | OK | OK | OK | None |
```

At the bottom, give a summary: "X of 12 pages fully consistent" or list the specific issues to fix.
