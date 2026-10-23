---
name: merge-upstream
description: 'Use when merging, syncing, or integrating upstream ExLibrisGroup/customModule changes into the MIT customization fork. Run the bundled deterministic Git workflow on a separate integration branch for a PR targeting mit-main; ask before pushing or opening the PR.'
---

# Merge upstream changes

Use the bundled [merge script](./scripts/merge-upstream.sh) for mechanical Git
operations. Do not reconstruct its commands or bypass its guards. Run from the
repository root:

```bash
bash .github/skills/merge-upstream/scripts/merge-upstream.sh help
```

The script never stashes, resets, rebases, force-pushes, deletes branches, merges
PRs, or deploys. It preserves upstream history with merge commits on a unique
`upstream/merge-YYYY-MM-DD[-N]` branch based on fetched `origin/mit-main`.
The fork's mirror `main` need not be synced.

## 1. Prepare

Read [mit-readme.md](../../../mit-readme.md), current CI workflows, package
scripts, and build configuration. Then run:

```bash
bash .github/skills/merge-upstream/scripts/merge-upstream.sh prepare
```

This checks the origin URLs, clean worktree (including untracked files), Git
identity, and absence of other Git operations. It fetches the MIT base and
upstream directly, records their SHAs, selects an unused local/remote branch
name, and starts a noncommitting merge.

It stores state in this worktree's Git directory, not in tracked files. It
never sources that state as shell code. Do not edit the state to bypass a
failure. An unfinished integration must be resumed, not overwritten.

| Exit | Meaning and next action |
|------|-------------------------|
| 0 | Command succeeded; continue with the next phase |
| 1 | Error or safety guard; inspect the reported cause |
| 10 | Upstream already integrated; stop without a new branch or PR |
| 11 | Conflicts remain; resolve and stage individual files |
| 12 | Remote MIT base moved; refresh and repeat validation/approval |
| 13 | Validation failed, is missing, or is stale; investigate and rerun |

## 2. Review and resolve

```bash
bash .github/skills/merge-upstream/scripts/merge-upstream.sh status
```

The script checks the branch, expected HEAD, merge target, and ancestry.
It does not choose conflict resolutions or stage user edits.

- Review each conflict's base, MIT, and upstream versions. Preserve MIT behavior
  while incorporating upstream fixes; never accept all of ours/theirs.
- Review clean merges too: component mappings and app wiring; MIT branding,
  themes, alerts, request cards, no-results behavior, and header/footer/homepage;
  asset URL services/directives and proxy paths; dependencies, build scripts,
  packaging, workflows, and repository customizations.
- Update directly affected tests/documentation. Use npm for lockfile updates
  after resolving manifests; do not silently bypass dependency errors.
- Stage intended paths explicitly. Ask for guidance when product behavior or
  the intended resolution is unclear. Do not rerun `prepare` to resume conflicts.

## 3. Validate

Review the merged CI/build configuration before executing its code. The script
currently requires Node 24, npm, and unzip and uses these existing CI commands:

```bash
bash .github/skills/merge-upstream/scripts/merge-upstream.sh validate
```

It runs `npm ci` only when dependencies are absent or manifests changed from the
recorded MIT base, then `npm test -- --no-watch --browsers=ChromeHeadless` and
`VIEW_ID=NDE_DEV npm run build`. It explicitly sets `INST_ID` from the reviewed
build settings without modifying the production view setting.

It verifies a fresh, nonempty, readable development ZIP containing
`remoteEntry.js` and customization assets under the expected view directory.
It records the validated Git tree and HEAD only after success. Unstaged,
untracked, conflicting, or build-generated source changes require review and
staging before validation can pass. Any later staged change invalidates that
validation for finalization/publication.

If upstream legitimately changes CI requirements or package layout, update the
script and its tests to match the reviewed configuration; do not bypass checks.
Report exact failures and missing prerequisites, never success-shaped fallbacks.

When feasible, smoke-test with `npm run start:proxy` following the MIT README.
Check branding, header/footer/homepage, alerts, request cards, no-results display,
and asset loading. Stop any server started solely for this check. Report
unavailable browser/Primo checks as pending; the script cannot verify them.

## 4. Finalize locally

Review the staged diff against the recorded MIT base. Prepare a commit-message
file outside the worktree, including the full upstream SHA reported by `status`
and the required trailer:

```text
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

Then run:

```bash
bash .github/skills/merge-upstream/scripts/merge-upstream.sh finalize /absolute/path/to/message.txt
```

The script requires validation of the exact staged tree and HEAD, commits the
merge, and checks clean state and both ancestors. Keep the integration branch.
Clean up the message file when no longer needed.

## 5. Obtain approval, then publish

Summarize the integration branch, full HEAD/base/upstream SHAs, incoming changes,
conflict resolutions, validation results, and pending manual checks. **Ask for
explicit approval to push and open a PR, then stop until approved.** A command
flag records which commit was approved; it cannot establish user consent.

Prepare a PR body outside the worktree containing that summary. After approval:

```bash
bash .github/skills/merge-upstream/scripts/merge-upstream.sh publish \
  --approved <full-approved-HEAD-SHA> \
  --title "Merge upstream customModule changes" \
  --body-file /absolute/path/to/pr-body.txt
```

This requires GitHub CLI (`gh`) authentication, a clean validated commit, and
the exact approved HEAD. It fetches the remote base again, pushes only the
integration branch, and opens or updates a PR with explicit base **`mit-main`**.
No tags are pushed. If PR creation fails after the push, report the partial
outcome; retrying publication checks for an existing open PR to avoid duplicates.
If `gh` is unavailable, report the limitation and the supplied compare URL;
do not publish through an alternate path without user agreement.

If publication exits 12:

```bash
bash .github/skills/merge-upstream/scripts/merge-upstream.sh refresh
```

Resolve any conflicts, rerun `validate` and `finalize`, and obtain renewed
approval for the resulting HEAD before retrying `publish`. A rewritten remote
base is an error requiring manual investigation, not an automatic reset.

Return the PR URL. Leave review, merge, and deployment to maintainers. Remove
temporary PR-body files when no longer needed. State is retained for retries;
after successful publication, a later `prepare` may start a new integration
from a clean worktree.

## Script maintenance

Run the isolated regression suite after changing the workflow:

```bash
node --test .github/skills/merge-upstream/scripts/merge-upstream.test.cjs
```

Tests use temporary repositories and local URL rewrites, with stubbed npm and
GitHub CLI commands. They exercise real Git and ZIP checks without contacting
GitHub or building/deploying the application. CI runs this suite before Angular
tests.
