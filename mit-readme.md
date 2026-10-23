# GitHub Repository configurations
## Special Branches
* `mit-main` is our default branch and contains our production code
  * Pushing directly to `mit-main` is disabled by a branch protection rule
* `main` is the fork's upstream mirror of https://github.com/ExLibrisGroup/customModule/tree/main and may need syncing
  * See instructions below for syncing with the forked repository

# Development workflows

1. If not already installed, clone this repository from GitHub and install the NDE development environment following the instructions in README.md.
2. Develop and test your changes locally following the instructions in README.md for using the NDE development environment.
3. Push a branch with your changes to our GitHub repository and open a PR to merge that branch into `mit-main` and request a review.
4. Once your PR is reviewed and approved, merge your changes into `mit-main`.

## Testing changes in a local development environment as part of code review
Testing locally in the dev environment is usually sufficient for code review.
1. Clone this repository from GitHub (or just `git pull origin [new-nde-changes]` if you already have our NDE development environment installed locally)
2. If not already installed, install the NDE development environment following the instructions in README.md.
3. Switch to the branch being tested: `git checkout [new-nde-changes]`.
4. Run the development server with proxy `npm run start:proxy`, following the instructions in README.md and confirm the changes work as expected.

## Testing changes by deploying to Primo testing environment as part of code review - An Alma Admin with access to Discovery Configuration must take these steps
In some cases it may be desirable to test changes in a production-like environment in addition to the local dev environment.
1. Push a branch with your changes to GitHub.
2. Run the GitHub Actions workflow for a development build targeting the branch you want to test.
3. The action's default setting creates a customization package for the NDE_DEV view, but this can be changed if you want to deploy the customization package to a different Primo view.
4. Download the customization package from the Development build action summary in the repo after the action completes
5. Upload the .zip file to the target Primo view via the Alma admin interface following the instructions at https://knowledge.exlibrisgroup.com/Primo/Product_Documentation/020Primo_VE/Primo_VE_(English)/050Display_Configuration/010Configuring_Discovery_Views_for_Primo_VE#Managing_Customization_Packages (Requires user with write access to Discovery Configuration in Alma)
6. Test the changes at https://mit.primo.exlibrisgroup.com/nde/home?vid=01MIT_INST:{view}

## Deploying to production STAGE view
In order to test changes against the most production-like environment, it is recommended to create a short-lived clone of the production view (`NDE`) `STAGE` 
1. Delete the existing `STAGE` view in production Primo if there is one.
2. Clone the `NDE` view and name the new view `STAGE`.
3. When a branch is merged into `mit-main`, a customization package targeting a `STAGE` view is created automatically.
4. Download the customization package from the Stage build action summary in the GitHub repo. 
5. Upload the .zip file to the `STAGE` view via the Alma admin interface following the instructions at https://knowledge.exlibrisgroup.com/Primo/Product_Documentation/020Primo_VE/Primo_VE_(English)/050Display_Configuration/010Configuring_Discovery_Views_for_Primo_VE#Managing_Customization_Packages (Requires user with write access to Discovery Configuration in Alma)

## Deploying to production NDE view
1. Tag a new release on the `mit-main` branch in GitHub.
2. This will automatically run tests and generate a customization package targeting the `NDE` view.
    - Note that the build artifact (01MIT_INST-NDE.zip) will land in the assets section of the release, not in the action summary: https://github.com/MITLibraries/Primo-NDE-Customization-Package/releases
3. Deploy the .zip file to production `NDE` view via the Alma admin interface following the instructions at https://knowledge.exlibrisgroup.com/Primo/Product_Documentation/020Primo_VE/Primo_VE_(English)/050Display_Configuration/010Configuring_Discovery_Views_for_Primo_VE#Managing_Customization_Packages (Requires user with write access to Discovery Configuration in Alma)

## Syncing with the upstream forked repository
This repository is forked from https://github.com/ExLibrisGroup/customModule

Use the repository's [merge-upstream skill](.github/skills/merge-upstream/SKILL.md)
by invoking `/merge-upstream` in a skill-enabled assistant, or follow the same
workflow manually:

1. Start with a clean worktree and no Git operation in progress. Fetch `origin`
   and fetch `main` directly from `https://github.com/ExLibrisGroup/customModule.git`.
   Record the fetched upstream SHA and the `origin/mit-main` SHA. Syncing the
   fork's `main` through GitHub's **Sync fork** button is optional, not a prerequisite.
2. If the upstream SHA is already an ancestor of `origin/mit-main`, no integration
   is needed. Otherwise, create a new, uniquely named integration branch (for
   example, `upstream/merge-2026-10-23`) from the recorded `origin/mit-main` SHA.
   Do not work directly on `mit-main` or overwrite an existing branch.
3. Merge the recorded upstream SHA on that branch, preserving upstream history
   with a merge commit. Resolve conflicts individually, preserve MIT
   customizations, and review cleanly merged changes as well.
4. Run the current CI tests and a development package build locally. Currently,
   these use Node 24, `npm test -- --no-watch --browsers=ChromeHeadless`, and
   `VIEW_ID=NDE_DEV npm run build`. Run `npm ci` if dependencies are missing or
   changed. Verify the generated customization ZIP and test MIT behavior using
   the local proxy as described above. Report unavailable manual checks explicitly.
5. Commit the validated integration on its branch and **keep the branch**.
   The assistant must ask for explicit approval before pushing or opening a PR.
6. After approval, fetch `origin` again. If `mit-main` has advanced, merge its new
   tip into the integration branch and repeat validation before publishing.
   Push only the integration branch and open a PR from it into **`mit-main`**.
   Do not push directly to `mit-main`, force-push, or automatically merge the PR.
7. Follow the review and deployment steps above. The integration branch, not the
   upstream mirror `main`, is the PR head so conflict resolutions and MIT-specific
   adjustments are included in the reviewed changes.

