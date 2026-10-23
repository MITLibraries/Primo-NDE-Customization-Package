#!/usr/bin/env bash
set -Eeuo pipefail
export GIT_PAGER=cat GIT_TERMINAL_PROMPT=0

repository=MITLibraries/Primo-NDE-Customization-Package
upstream_url=https://github.com/ExLibrisGroup/customModule.git

usage() {
    cat <<'EOF'
Usage: bash merge-upstream.sh <command>
  prepare                         Fetch and begin a merge on a new branch
  status                          Show recorded state and unresolved paths
  refresh                         Fetch and merge a newer origin/mit-main
  validate                        Test, build, inspect ZIP, and record tree
  finalize <message-file>          Commit the validated merge
  publish --approved <HEAD> --title <title> --body-file <file>
                                  Push and open/reuse a PR after approval

Exit codes: 0 success, 1 error, 10 already integrated,
11 conflicts need resolution, 12 base moved (refresh required),
13 validation failed. State is stored in this worktree's Git directory.
EOF
}

fail() { printf 'ERROR: %s\n' "$2" >&2; exit "$1"; }
[[ $# -gt 0 ]] || { usage; exit 1; }
command=$1
shift
case "$command" in
    help|--help|-h) usage; exit 0 ;;
    prepare|status|refresh|validate) [[ $# == 0 ]] || fail 1 'Unexpected arguments.' ;;
    finalize) [[ $# == 1 && -s $1 ]] || fail 1 'Provide a nonempty commit message file.'
        message_file=$(realpath "$1") ;;
    publish) [[ $# == 6 && $1 == --approved && $3 == --title && $5 == --body-file ]] ||
        fail 1 'Expected --approved <HEAD> --title <title> --body-file <file>.'
        approved=$2; title=$4
        [[ -n $title && -s $6 ]] || fail 1 'Provide a title and nonempty PR body file.'
        body_file=$(realpath "$6") ;;
    *) usage; fail 1 'Unknown command.' ;;
esac

trap 'printf "ERROR: command failed at line %s (exit %s).\n" "$LINENO" "$?" >&2; exit 1' ERR
root=$(git rev-parse --show-toplevel)
cd "$root"
state_dir=$(git rev-parse --path-format=absolute --git-path merge-upstream)
state_file=$state_dir/state
mkdir -p "$state_dir"
mkdir "$state_dir/lock" || fail 1 "Another invocation is active; inspect $state_dir/lock."
trap 'rmdir "$state_dir/lock"' EXIT

get() { git config --file "$state_file" --get "merge.$1"; }
put() { git config --file "$state_file" "merge.$1" "$2"; }
head_sha() { git rev-parse HEAD; }
git_path_exists() { [[ -e $(git rev-parse --git-path "$1") ]]; }
ancestor() {
    local result
    if git merge-base --is-ancestor "$1" "$2"; then return 0; else result=$?; fi
    [[ $result == 1 ]] || fail 1 'Unable to check commit ancestry.'
    return 1
}
check_origin() {
    local url configured_pushurls result
    local -a urls pushurls
    url=$(git config --get-all remote.origin.url)
    mapfile -t urls <<< "$url"
    pushurls=()
    if configured_pushurls=$(git config --get-all remote.origin.pushurl); then
        mapfile -t pushurls <<< "$configured_pushurls"
    else
        result=$?
        [[ $result == 1 ]] || fail 1 'Unable to read origin push URLs.'
    fi
    [[ ${#urls[@]} == 1 && ${#pushurls[@]} -le 1 ]] ||
        fail 1 'origin must have one fetch URL and at most one push URL.'
    for url in "${urls[@]}" "${pushurls[@]}"; do
        case "$url" in
            "https://github.com/$repository"|"https://github.com/$repository.git"|\
            "git@github.com:$repository"|"git@github.com:$repository.git"|\
            "ssh://git@github.com/$repository"|"ssh://git@github.com/$repository.git") ;;
            *) fail 1 'origin must point to the MIT customization fork for fetching and pushing.' ;;
        esac
    done
}
check_other_operations() {
    local operation
    for operation in rebase-merge rebase-apply CHERRY_PICK_HEAD REVERT_HEAD sequencer BISECT_START; do
        if git_path_exists "$operation"; then fail 1 "Git operation active: $operation"; fi
    done
}
require_clean() {
    [[ -z $(git status --porcelain --untracked-files=all) ]] ||
        fail 1 'Worktree/index must be clean, including untracked files. Nothing was stashed or discarded.'
}
require_staged() {
    [[ -z $(git diff --name-only --diff-filter=U) ]] || fail 11 'Resolve and stage all conflicts first.'
    git diff --quiet || fail 13 'Review and stage intended working-tree changes before validation/finalization.'
    [[ -z $(git ls-files --others --exclude-standard) ]] ||
        fail 13 'Review untracked files before validation/finalization.'
    git diff --check || fail 13 'Working-tree whitespace errors.'
    git diff --cached --check || fail 13 'Staged whitespace errors.'
}
load_state() {
    [[ -f $state_file ]] || fail 1 'No recorded integration. Run prepare first.'
    branch=$(get branch); base=$(get base); upstream=$(get upstream); expected_head=$(get head)
    [[ $branch == upstream/merge-* ]] || fail 1 'Invalid recorded integration branch.'
    [[ $(git branch --show-current) == "$branch" ]] || fail 1 "Switch to recorded branch: $branch"
    [[ $(head_sha) == "$expected_head" ]] || fail 1 'HEAD changed outside the script; inspect the recorded state.'
    git cat-file -e "$base^{commit}"
    git cat-file -e "$upstream^{commit}"
    check_other_operations
    if git_path_exists MERGE_HEAD; then
        [[ $(cat "$(git rev-parse --git-path MERGE_HEAD)") == "$(get target)" ]] ||
            fail 1 'The active merge does not match the recorded merge target.'
    else
        ancestor "$base" HEAD && ancestor "$upstream" HEAD ||
            fail 1 'The recorded merge was aborted or is incomplete.'
    fi
}
invalidate_validation() {
    put validated-tree ''
    put validated-head ''
    put published false
}
begin_merge() {
    local result
    if git merge --no-ff --no-commit "$1"; then return; else result=$?; fi
    if [[ -n $(git diff --name-only --diff-filter=U) ]]; then
        git diff --name-only --diff-filter=U
        fail 11 'Merge paused for conflict resolution. Resolve, stage, then validate; do not rerun prepare.'
    fi
    fail 1 "Merge failed (exit $result). Inspect Git state; no automatic abort was attempted."
}
verify_validation() {
    require_staged
    [[ $(get validated-tree) == "$(git write-tree)" && $(get validated-head) == "$(head_sha)" ]] ||
        fail 13 'This exact tree and HEAD have not passed validate. Run validate again.'
}

check_origin
# Parse Git operations as one block; branch switches may replace this file.
case "$command" in
    prepare)
        check_other_operations
        if git_path_exists MERGE_HEAD; then fail 1 'A merge is already active.'; fi
        require_clean
        if [[ -f $state_file && $(get published) != true ]]; then
            fail 1 "An integration is already recorded in $state_file. Resume it with status."
        fi
        git var GIT_AUTHOR_IDENT >/dev/null
        git var GIT_COMMITTER_IDENT >/dev/null
        git fetch --no-tags origin refs/heads/mit-main:refs/remotes/origin/mit-main
        base=$(git rev-parse refs/remotes/origin/mit-main)
        git fetch --no-tags "$upstream_url" refs/heads/main
        upstream=$(git rev-parse FETCH_HEAD)
        if ancestor "$upstream" "$base"; then
            printf 'ALREADY_INTEGRATED upstream=%s base=%s\n' "$upstream" "$base"
            exit 10
        fi
        git log --oneline "$base..$upstream"
        git diff --stat "$base...$upstream"
        stem=upstream/merge-$(date -u +%Y-%m-%d)
        branch=$stem; suffix=1
        remote_heads=$(git ls-remote --heads origin)
        remote_heads=$(cut -f2 <<< "$remote_heads")
        while git show-ref --verify --quiet "refs/heads/$branch" ||
            grep -Fxq "refs/heads/$branch" <<< "$remote_heads"; do
            branch=$stem-$suffix
            suffix=$((suffix + 1))
        done
        git switch --no-track -c "$branch" "$base"
        put branch "$branch"; put base "$base"; put upstream "$upstream"
        put head "$base"; put target "$upstream"
        invalidate_validation
        printf 'PREPARED branch=%s base=%s upstream=%s\n' "$branch" "$base" "$upstream"
        begin_merge "$upstream"
        ;;
    status)
        load_state
        printf 'branch=%s\nbase=%s\nupstream=%s\nhead=%s\nvalidated-tree=%s\npublished=%s\n' \
            "$branch" "$base" "$upstream" "$expected_head" "$(get validated-tree)" "$(get published)"
        git status --short --branch
        if [[ -n $(git diff --name-only --diff-filter=U) ]]; then exit 11; fi
        ;;
    refresh)
        load_state
        if git_path_exists MERGE_HEAD; then fail 1 'Finalize the current merge before refreshing the base.'; fi
        require_clean
        git fetch --no-tags origin refs/heads/mit-main:refs/remotes/origin/mit-main
        new_base=$(git rev-parse refs/remotes/origin/mit-main)
        if [[ $new_base == "$base" ]]; then printf 'BASE_UNCHANGED\n'; exit 0; fi
        ancestor "$base" "$new_base" || fail 1 'mit-main history was rewritten; manual investigation required.'
        put base "$new_base"; put target "$new_base"
        invalidate_validation
        begin_merge "$new_base"
        printf 'BASE_REFRESHED: validate and finalize again, then obtain renewed approval.\n'
        ;;
    validate)
        load_state
        invalidate_validation
        require_staged
        command -v unzip >/dev/null || fail 13 'Install unzip to inspect the build artifact.'
        [[ $(node --version) == v24.* ]] || fail 13 'Validation currently requires Node 24, matching CI.'
        institution=$(sed -n 's/^INST_ID=//p' build-settings.env)
        [[ $institution =~ ^[A-Za-z0-9_]+$ ]] || fail 13 'Expected one plain INST_ID value in build-settings.env.'
        tree=$(git write-tree)
        if [[ ! -d node_modules ]] ||
            ! git diff --quiet "$base" -- package.json package-lock.json; then
            npm ci || fail 13 'npm ci failed.'
        fi
        npm test -- --no-watch --browsers=ChromeHeadless || fail 13 'Unit tests failed.'
        touch "$state_dir/build-start"
        INST_ID="$institution" VIEW_ID=NDE_DEV npm run build || fail 13 'Development build failed.'
        artifact="dist/$institution-NDE_DEV.zip"
        [[ -s $artifact && $artifact -nt $state_dir/build-start ]] ||
            fail 13 'Build did not produce a fresh, nonempty development ZIP.'
        unzip -tq "$artifact" || fail 13 'Development ZIP is corrupt.'
        entries=$(unzip -Z1 "$artifact") || fail 13 'Cannot list development ZIP.'
        grep -Fxq "$institution-NDE_DEV/remoteEntry.js" <<< "$entries" ||
            fail 13 'Development ZIP is missing remoteEntry.js under its view directory.'
        grep -Eq "^$institution-NDE_DEV/assets/.+[^/]$" <<< "$entries" ||
            fail 13 'Development ZIP is missing customization assets.'
        require_staged
        [[ $(git write-tree) == "$tree" && $(head_sha) == "$expected_head" ]] ||
            fail 13 'Build changed the staged tree or HEAD. Review changes and validate again.'
        put validated-tree "$tree"; put validated-head "$expected_head"
        printf 'VALIDATED tree=%s artifact=%s\n' "$tree" "$artifact"
        ;;
    finalize)
        load_state
        verify_validation
        if git_path_exists MERGE_HEAD; then
            grep -Fq "$upstream" "$message_file" || fail 1 'Commit message must include the upstream SHA.'
            grep -Fxq 'Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>' "$message_file" ||
                fail 1 'Commit message must include the Copilot co-author trailer.'
            git commit --file "$message_file"
            put head "$(head_sha)"
            put validated-head "$(head_sha)"
        fi
        require_clean
        ancestor "$base" HEAD && ancestor "$upstream" HEAD || fail 1 'Final commit is missing recorded ancestry.'
        verify_validation
        printf 'FINALIZED branch=%s head=%s; approval required before publish.\n' "$branch" "$(head_sha)"
        ;;
    publish)
        load_state
        [[ $approved == "$(head_sha)" ]] || fail 1 'Approval must identify the exact current full HEAD SHA.'
        if git_path_exists MERGE_HEAD; then fail 1 'Finalize the merge before publishing.'; fi
        require_clean
        verify_validation
        git fetch --no-tags origin refs/heads/mit-main:refs/remotes/origin/mit-main
        [[ $(git rev-parse refs/remotes/origin/mit-main) == "$base" ]] ||
            fail 12 'mit-main moved. Run refresh, validate, finalize, and obtain renewed approval.'
        command -v gh >/dev/null ||
            fail 1 "GitHub CLI (gh) is required. No push attempted. Compare URL: https://github.com/$repository/compare/mit-main...$branch"
        gh auth status
        pr=$(gh pr list --repo "$repository" --base mit-main --head "$branch" \
            --state open --json url --jq '.[0].url // empty')
        git push --no-follow-tags -u origin "HEAD:refs/heads/$branch"
        if [[ -n $pr ]]; then
            gh pr edit "$pr" --repo "$repository" --title "$title" --body-file "$body_file"
            printf 'EXISTING_PR %s\n' "$pr"
        else
            gh pr create --repo "$repository" --base mit-main --head "$branch" \
                --title "$title" --body-file "$body_file"
        fi
        put published true
        printf 'PUBLISHED: leave PR review, merge, and deployment to maintainers.\n'
        ;;
esac
