---
name: sync-upstream
description: 'Use when syncing, merging, or pulling in changes from the upstream ExLibrisGroup/customModule repository into this MIT fork. Fetches upstream/main, checks for upstream commits not yet in mit-main and stops without creating a branch if there are none; otherwise creates a sync branch, merges and tests the changes, and prepares it for a PR into mit-main.'
---

# Sync with the upstream repository

This repository is forked from https://github.com/ExLibrisGroup/customModule.
Use this skill to bring upstream changes into our fork via a reviewable branch
and PR, following the process documented in
[mit-readme.md](../../../mit-readme.md).

## When to use
- The user asks to sync, merge, or pull in upstream changes.
- The user references the upstream `ExLibrisGroup/customModule` repository.
- A scheduled or ad hoc check for new upstream commits is requested.

## Before you start
Confirm the working tree is clean before making any branch changes:

```bash
git status --porcelain
```

If there are uncommitted changes, stop and ask the user how to proceed before
continuing.

## Procedure

1. **Ensure the `upstream` remote exists.** Check with `git remote -v`. If
   `upstream` is missing, add it:
   ```bash
   git remote add upstream https://github.com/ExLibrisGroup/customModule.git
   ```

2. **Fetch the latest upstream changes:**
   ```bash
   git fetch upstream
   ```

3. **Update the local `mit-main` branch:**
   ```bash
   git checkout mit-main
   git pull origin mit-main
   ```

4. **Check whether upstream has commits missing from `mit-main`:**
   ```bash
   git rev-list --count mit-main..upstream/main
   ```
   If the count is `0`, report that `mit-main` already contains all commits from
   `upstream/main` and stop here. Do not create a branch, run the proxy test, push,
   or open a PR. If the count is greater than `0`, continue with the sync.

5. **Create a new branch from `mit-main` for the sync**, named with today's
   date:
   ```bash
   git checkout -b sync-upstream-YYYY-MM-DD
   ```
   Replace `YYYY-MM-DD` with the current date. If a branch with that name
   already exists, append `-2`, `-3`, etc.

6. **Merge the upstream changes directly into the new branch:**
   ```bash
   git merge upstream/main
   ```
   If conflicts occur, resolve them manually — preserve MIT-specific
   customizations (branding, themes, alerts, request cards, no-results
   behavior, header/footer/homepage assets, proxy and asset-path services)
   while incorporating upstream fixes. Never blindly accept "ours" or
   "theirs" for every conflicting file. Stage resolved files explicitly, and
   ask the user if a resolution is unclear.

7. **Test the changes locally.** Follow the instructions in README.md:
   ```bash
   npm run start:proxy
   ```
   Confirm the app starts and nothing is broken before proceeding. Stop the
   server when the check is done.

8. **Push the branch to GitHub:**
   ```bash
   git push origin sync-upstream-YYYY-MM-DD
   ```
   Ask for explicit confirmation before pushing, since this makes the branch
   visible to the team.

9. **Open a PR** on GitHub to merge the new branch into `mit-main` and request
   a review. Summarize the upstream changes being pulled in and note any
   conflict resolutions made in step 6.

10. Once the PR is reviewed and approved, follow the testing and deployment
   steps in [mit-readme.md](../../../mit-readme.md) to merge and deploy to
   production.

## Notes
- This fork does not maintain a local or remote `main` branch that mirrors
  `upstream/main`. Always fetch and merge `upstream/main` directly from the
  `upstream` remote — do not recreate a persistent `main` branch.
- Do not rebase, force-push, or rewrite history on the sync branch — keep the
  merge commit so the PR shows exactly what came from upstream.
- Never push to `mit-main` directly; it's protected and only accepts merges
  via reviewed PRs.
