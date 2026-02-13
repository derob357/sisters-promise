---
name: add-to-all-pages
description: Bulk-inject an HTML snippet across all 12 site pages with correct relative paths
argument-hint: <what to add and where>
user-invocable: true
allowed-tools: Read, Edit, Grep, Glob
---

# Add to All Pages — Bulk HTML Snippet Injection

Apply an HTML snippet to all Sister's Promise site pages, automatically handling the path differences between root-level and pages/ directory files.

## Site Pages

The complete list of live site HTML files:

**Root level** (paths use `./assets/`, `./pages/`):
- `index.html`

**Pages directory** (paths use `../assets/`, peer filenames like `shop.html`):
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

## Instructions

The user will describe what to add via `$ARGUMENTS`. For example:
- "add `<script src="analytics.js">` before `</body>`"
- "add `<li id="cart-nav"></li>` after the Contact nav link"
- "add `<meta name="theme-color" content="#C9A961">` to the `<head>`"

For each file:

1. **Check for duplicates**: Before inserting, verify the snippet (or its key identifier) does not already exist in the file. Skip files where it's already present and report them as "already has it".

2. **Adjust relative paths**: If the snippet contains asset paths:
   - For `index.html`: use `./assets/js/`, `./assets/css/`, `./pages/`
   - For `pages/*.html`: use `../assets/js/`, `../assets/css/`, peer filenames

3. **Apply the edit**: Insert the snippet at the specified location.

4. **Report results**: Show a summary table:
   ```
   File                          | Status
   ------------------------------|--------
   index.html                    | Updated
   pages/shop.html               | Updated
   pages/rewards.html            | Already present (skipped)
   ...
   ```
   Include a total count: "Updated X of 12 files (Y already had it, Z skipped)".

## Important

- Do NOT modify files outside the list above (no email templates, mockups, etc.)
- Do NOT change any existing content — only add the requested snippet
- If the insertion point cannot be found in a file, report it as an error rather than guessing
