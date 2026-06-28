# SKXNZ MASTER CONTROL

**Project:** SKXNZ — AI-powered premium futurewear marketplace  
**Tagline:** WEAR THE SIGNAL.  
**Primary codebase root:** `website/`  
**Package manager:** `pnpm@10.33.0`  
**Default branch:** `main`

## 1. Mission

Build a premium, scalable, India-first fashion marketplace with a global visual standard. The product must support buyers, sellers, riders, admins, AI-assisted shopping, orders, payments, delivery tracking, returns, support, and analytics.

The interface must feel compact, premium, intentional, and original. It must not look like a generic template or a direct copy of another marketplace.

## 2. Non-negotiable design rules

- Solid dark-maroon header; no glass effect.
- Premium, sharp, compact typography.
- Avoid childish blue/pink gradients.
- Avoid oversized text, excessive spacing, soft rounded cards, and heavy shadows.
- Prefer clean rectangular surfaces, precise alignment, and dense-but-breathable layouts.
- Product cards should show: brand, product name, current price, old price where applicable, wishlist, and preview.
- Target 5–6 product cards per desktop row where the layout allows.
- Use real brand logos in the brand bar, not plain text.
- Hero must use one main image per slide, full-width, with clean arrows/dots and restrained motion.
- Homepage must feel content-rich, not empty.
- Include an uneven fitted category mosaic within the homepage.
- Mobile layouts must be compact and free from overflow, clipping, or overlapping controls.

## 3. Core product areas

1. Buyer website
2. Seller dashboard/app
3. Rider app
4. Admin back office
5. AI stylist
6. AI outfit builder
7. AI try-on
8. AI seller tools
9. Product video generation
10. Orders, payments, tracking, returns, support, and analytics
11. Community / “Styled by”
12. Brand pages and premium editorial landing experiences

## 4. Technical direction

- Frontend: Next.js
- Hosting: Vercel
- Database/Auth: Supabase planned
- Seed data: Google Sheets currently used
- Git branch: `main`
- Package manager: `pnpm@10.33.0`
- Use the existing lockfile.
- Never replace the stack or restructure the project without explicit need.
- Do not introduce paid dependencies unless approved.
- Prefer free, stable, maintained tools.

## 5. Codex operating rules

Before editing:

1. Read only the files directly relevant to the task.
2. Do not rescan the full repository unless the task genuinely requires it.
3. Confirm the exact target files before making changes.
4. Check `git status`.
5. Preserve existing working features.

During editing:

- Keep changes narrowly scoped.
- Do not edit unrelated files.
- Do not rewrite large files when a small patch is enough.
- Do not change package versions unless required.
- Do not delete environment files.
- Do not expose secrets.
- Do not create duplicate components when reusable components already exist.
- Do not run destructive commands.
- Do not silently change design direction.

After editing:

1. Run the smallest relevant validation first.
2. Run lint.
3. Run build when the task affects production code.
4. Report changed files.
5. Report what was tested.
6. Report any remaining issue honestly.
7. Create a checkpoint only after tests pass.

## 6. Windows command rules

Use Windows-safe commands:

```powershell
pnpm.cmd --version
pnpm.cmd install --frozen-lockfile
pnpm.cmd dev
pnpm.cmd lint
pnpm.cmd build
git status
```

If `npm` is blocked through PowerShell scripts, use `npm.cmd`.

## 7. Task response format

Every completed Codex task should end with:

### Completed
- Exact result

### Files changed
- File paths

### Validation
- Commands run
- Pass/fail result

### Remaining issues
- Only real unresolved items

### Checkpoint
- Commit/checkpoint reference if created

## 8. Efficiency rules

- One task = one clear outcome.
- Do not mix frontend, backend, database, and deployment work in one task.
- Avoid repeated repository-wide analysis.
- Use the current-status and next-build-queue files as the source of truth.
- If a task is blocked, stop and report the blocker instead of attempting unrelated work.
- Never spend tokens narrating obvious intermediate steps.
- Ask for approval only when required for permissions, destructive actions, network access, or irreversible changes.

## 9. Safety rules

- Never commit `.env`, `.env.local`, API keys, service-role keys, payment secrets, or private customer data.
- Never make production database changes without a migration and rollback plan.
- Never bypass authentication or authorization checks.
- Never weaken security to make a feature work.
- Never use placeholder success messages for incomplete backend features.

## 10. Definition of done

A task is done only when:

- The requested behavior is implemented.
- Relevant pages render correctly.
- No new obvious layout regression exists.
- Lint passes.
- Build passes when applicable.
- Git status is reviewed.
- The result is documented clearly.
