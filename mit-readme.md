# GitHub repository configurations
## Special branches
* `mit-main` is our default branch and contains our production code
  * Pushing directly to `mit-main` is disabled by a branch protection rule

# Development workflows

This is the standard workflow for making and merging changes.

1. If not already installed, clone this repository from GitHub and install the NDE development environment following the instructions in README.md.
2. Develop and test your changes locally following the instructions in README.md for using the NDE development environment.
3. Push a branch with your changes to our GitHub repository and open a PR to merge that branch into `mit-main` and request a review.
4. Once your PR is reviewed and approved, merge your changes into `mit-main`.

## Testing changes in a local development environment as part of code review
Testing locally in the dev environment is usually sufficient for code review.
1. Clone this repository from GitHub (or just `git pull origin [new-nde-changes]` if you already have your NDE development environment installed locally).
2. If not already installed, install the NDE development environment following the instructions in README.md.
3. Switch to the branch being tested: `git checkout [new-nde-changes]`.
4. Run the development server with proxy `npm run start:proxy`, following the instructions in README.md and confirm the changes work as expected.

## Testing changes by deploying to Primo testing environment as part of code review
Deploying to a Primo testing environment lets you validate changes in a production-like environment in addition to the local dev environment. This requires an Alma Admin with write access to Discovery Configuration.
1. Push a branch with your changes to GitHub.
2. Run the GitHub Actions workflow for a development build targeting the branch you want to test.
3. The action's default setting creates a customization package for the NDE_DEV view, but this can be changed if you want to deploy the customization package to a different Primo view.
4. Download the customization package from the Development build action summary in the repo after the action completes.
5. Upload the .zip file to the target Primo view via the Alma admin interface following the instructions at https://knowledge.exlibrisgroup.com/Primo/Product_Documentation/020Primo_VE/Primo_VE_(English)/050Display_Configuration/010Configuring_Discovery_Views_for_Primo_VE#Managing_Customization_Packages (Requires user with write access to Discovery Configuration in Alma).
6. Test the changes at https://mit.primo.exlibrisgroup.com/nde/home?vid=01MIT_INST:{view}.

## Deploying to production STAGE view
Testing against a short-lived clone of the production `NDE` view, named `STAGE`, provides the most production-like environment for validating changes before release.
1. Delete the existing `STAGE` view in production Primo if there is one.
2. Clone the `NDE` view and name the new view `STAGE`.
3. When a branch is merged into `mit-main`, a customization package targeting a `STAGE` view is created automatically.
4. Download the customization package from the Stage build action summary in the GitHub repo.
5. Upload the .zip file to the `STAGE` view via the Alma admin interface following the instructions at https://knowledge.exlibrisgroup.com/Primo/Product_Documentation/020Primo_VE/Primo_VE_(English)/050Display_Configuration/010Configuring_Discovery_Views_for_Primo_VE#Managing_Customization_Packages (Requires user with write access to Discovery Configuration in Alma).

## Deploying to production NDE view
Deploying to the production `NDE` view makes changes available to all users.
1. Tag a new release on the `mit-main` branch in GitHub.
2. This will automatically run tests and generate a customization package targeting the `NDE` view.
    - Note that the build artifact (`01MIT_INST-NDE-<build-id>.zip`) will land in the assets section of the release, not in the action summary: https://github.com/MITLibraries/Primo-NDE-Customization-Package/releases
3. Deploy the .zip file to production `NDE` view via the Alma admin interface following the instructions at https://knowledge.exlibrisgroup.com/Primo/Product_Documentation/020Primo_VE/Primo_VE_(English)/050Display_Configuration/010Configuring_Discovery_Views_for_Primo_VE#Managing_Customization_Packages (Requires user with write access to Discovery Configuration in Alma).

## Confirming the deployed build

All development, stage, and production GitHub Actions builds use `<run_id>-<run_attempt>` as their build ID. Rerunning a workflow increments the attempt, producing a different ID.

The downloaded ZIP is named `<INST_ID>-<VIEW_ID>-<build-id>.zip`, for example `01MIT_INST-NDE-123456789-1.zip`. The folder inside the ZIP remains `<INST_ID>-<VIEW_ID>` as required by Alma.

To confirm which package is running, open the browser developer tools Console and reload the Primo view. When the customization module starts, it logs:

```text
[MIT Libraries customization] Build ID: 123456789-1
```

Match this value to the downloaded ZIP filename. Ensure informational messages are visible in the Console.

Local builds and development servers use `local` unless you set `BUILD_ID`, for example `BUILD_ID=my-test-1 npm run build`. Build IDs must start with a letter or number and contain only letters, numbers, dots, underscores, or hyphens.

## Syncing with the upstream forked repository
This repository is forked from https://github.com/ExLibrisGroup/customModule

If you're using a Copilot agent-enabled editor, invoke the [sync-upstream skill](../.github/skills/sync-upstream/SKILL.md) to run this process for you. Otherwise, take the following steps manually to sync our repository with changes from this upstream repository.

1. (Optional, one-time setup) If you don't already have an `upstream` remote configured, check with `git remote -v`. If `upstream` is missing, add it: `git remote add upstream https://github.com/ExLibrisGroup/customModule.git`.
2. Fetch the latest changes from the upstream repository: `git fetch upstream`.
3. Update your local `mit-main` branch: `git checkout mit-main && git pull origin mit-main`.
4. Create a new branch from `mit-main` for the sync, e.g. `git checkout -b sync-upstream-YYYY-MM-DD`.
5. Merge the upstream changes directly into your new branch: `git merge upstream/main`. Resolve any merge conflicts if they occur.
6. Test the changes locally by running the development server with proxy `npm run start:proxy`, following the instructions in README.md, and confirm nothing is broken.
7. Push your branch to GitHub: `git push origin sync-upstream-YYYY-MM-DD`.
8. Open a PR on GitHub to merge your branch into `mit-main` and request a review.
9. Once your PR is reviewed and approved, follow the steps above for testing and deploying to production.
