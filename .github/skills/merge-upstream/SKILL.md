---
name: merge-upstream
description: 'Use when merging, syncing, or integrating upstream ExLibrisGroup/customModule changes into the MIT customization fork. Prepare and validate a separate integration branch for a PR targeting mit-main; ask before pushing or opening the PR.'
---

# Merge upstream changes

## Outcome and boundaries

Integrate upstream `ExLibrisGroup/customModule` branch `main` into a new branch
based on `origin/mit-main`. Keep that branch for review, with a PR targeting
`MITLibraries/Primo-NDE-Customization-Package:mit-main`.

- Never commit or push directly to `mit-main`, merge the PR, deploy, or create a
  release as part of this skill.
- Prepare and validate locally first. Ask for explicit approval before pushing
  the integration branch or creating a PR.
- Do not reset, rebase, force-push, delete existing branches, stash user changes,
  or use blanket conflict resolution such as accepting all of ours/theirs.
- Read [mit-readme.md](../../../mit-readme.md) for branch and deployment policy.
  This workflow does not require syncing the fork's `main` branch in GitHub.

## 1. Preflight

1. Inspect `git status --short --branch`, `git remote -v`, and the current branch.
   Confirm `origin` identifies `MITLibraries/Primo-NDE-Customization-Package`
   (HTTPS and SSH URLs are both valid). Stop and ask if it points elsewhere.
2. Require a clean worktree, including untracked files, and no merge, rebase, or
   cherry-pick in progress. If it is dirty or an operation is active, stop and
   ask the user how to proceed; do not modify or discard their work.
3. Read the current package scripts, lockfile, GitHub Actions workflows,
   [README.md](../../../README.md), and MIT customizations. Use the CI Node
   version and validation commands rather than assuming upstream requirements
   match MIT's environment.

## 2. Fetch and choose the integration branch

1. Fetch the MIT fork and upstream without changing local branches:

   ```bash
   git fetch origin
   git fetch https://github.com/ExLibrisGroup/customModule.git main
   git rev-parse FETCH_HEAD
   git rev-parse origin/mit-main
   ```

   Record these full SHAs as the upstream source and MIT base. Capture the
   upstream SHA immediately after fetching it, before any other fetch can
   overwrite `FETCH_HEAD`. Stop on fetch or ref-resolution failures.
2. Run `git merge-base --is-ancestor <upstream-sha> <mit-base-sha>`.
   Exit 0 means upstream is already integrated: report that no merge or PR is
   needed and stop. Exit 1 means there are changes to integrate; any other exit
   is an error to investigate. Review incoming commits with
   `git log --oneline <mit-base-sha>..<upstream-sha>` and the upstream-side diff
   with `git diff --stat <mit-base-sha>...<upstream-sha>`.
3. Choose an unused branch such as `upstream/merge-YYYY-MM-DD`, adding a suffix
   if it exists locally or on origin. Never reuse or overwrite an existing
   branch without the user's approval.
4. Create it from the recorded MIT base:

   ```bash
   git switch --no-track -c <integration-branch> <mit-base-sha>
   git merge --no-ff --no-commit <upstream-sha>
   ```

   Use the recorded SHA, not local `main`, which may be stale or diverged.
   Preserve upstream history with a merge commit instead of cherry-picking or
   squashing it.

## 3. Resolve and review

1. Inspect the merge result and `git diff --name-only --diff-filter=U`.
   A conflict is not a successful merge. Review each conflicting file and its
   base, MIT, and upstream versions before editing; stage resolved paths
   explicitly. Stop for user guidance when a resolution changes product
   behavior or the intended outcome is unclear.
2. Review cleanly merged changes too, especially:
   - MIT components and their mappings, app wiring, branding, themes, alerts,
     request cards, no-results behavior, and header/footer/homepage assets.
   - Asset URL services/directives, proxy configuration, and runtime paths.
   - Dependencies and lockfile, Angular/module federation configuration,
     prebuild/postbuild scripts, build settings, packaging, and CI workflows.
   - MIT documentation and repository customizations under `.github/`.
3. Preserve MIT behavior while incorporating upstream fixes. Do not blindly
   keep MIT's entire file or replace it wholesale with upstream's. Update
   directly affected tests and documentation; avoid unrelated cleanup.
4. If dependency resolution changes the manifest, update the lockfile using
   npm, not manual conflict-marker removal alone. Inspect the resulting diff.
   Do not silently bypass peer-dependency errors or upgrade unrelated packages.

## 4. Validate locally and commit

1. Re-read the merged scripts and CI configuration. Run their current
   equivalents; at the time this skill was written CI uses Node 24 and:

   ```bash
   npm ci
   npm test -- --no-watch --browsers=ChromeHeadless
   VIEW_ID=NDE_DEV npm run build
   ```

   Run `npm ci` when dependencies are missing or the manifest/lockfile changed.
   If dependencies are already installed and unchanged, try validation first.
   The `VIEW_ID` override builds a development package without editing the
   tracked production setting in `build-settings.env`.
2. Verify the build actually produces a nonempty
   `dist/01MIT_INST-NDE_DEV.zip` with the expected customization contents
   (adjust the expected name if the reviewed institution setting changed).
   Inspect tracked/untracked changes after building: prebuild can rewrite
   sources. Account for every generated change; never discard a source change
   just because a build touched it or commit build output.
3. When feasible, smoke-test with `npm run start:proxy` using the MIT README's
   setup. Check branding, header/footer/homepage, alerts, request cards,
   no-results display, and asset loading. Stop any server started just for this
   check. If browser/Primo access is unavailable, report manual checks as pending,
   not passed.
4. Verify there are no unresolved paths. Run `git diff --check` and
   `git diff --cached --check`, and inspect the full staged diff against the
   recorded MIT base. Report exact test/build failures and missing prerequisites;
   do not claim readiness or publish a failed integration.
5. Stage only intended paths and commit the merge on the integration branch.
   Include the upstream SHA in the message and the repository-required trailer:

   ```text
   Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
   ```

   Confirm a clean worktree and verify both recorded SHAs are ancestors of
   `HEAD`. Keep the integration branch; do not delete it after testing.

## 5. Approval and PR handoff

1. Summarize the branch, recorded base/upstream SHAs, incoming changes,
   conflict resolutions, validation results, and pending manual checks.
   Ask whether to push this branch and open a PR. Until approved, stop with
   the committed branch local only.
2. After approval, fetch origin again. If `origin/mit-main` moved since the
   recorded base, merge the new base into the integration branch and repeat
   resolution, validation, and commit checks. If the result materially changes,
   obtain renewed approval before publishing.
3. Push only the integration branch using an explicit refspec:

   ```bash
   git push -u origin HEAD:refs/heads/<integration-branch>
   ```

   Never force-push. On failure, report it and investigate without rewriting
   remote history.
4. Open a PR with explicit repository, head, and **base `mit-main`**, using
   available GitHub tooling. Check for an existing open PR from the same head
   first to avoid duplicates. Include the recorded SHAs, change summary,
   conflict resolutions, exact validation results, and pending manual checks.
   If PR tooling/authentication is unavailable, report that limitation and
   provide a compare URL and prepared PR text; do not claim a PR was created.
5. Return the PR URL and leave review, merge, and deployment to the normal
   process in the MIT README. Never merge the PR automatically.
