# GitHub Repository configurations
## Special Branches
* `mit-main` is our default branch and contains our production code
  * Pushing directly to `mit-main` is disabled by a branch protection rule
* `main` tracks the forked upstream repository's `main` branch at https://github.com/ExLibrisGroup/customModule/tree/main
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

## Syncing with the upstream forked repository.
This repository is forked from https://github.com/ExLibrisGroup/customModule

Take the following steps to sync our local repository with changes from this upstream repository.

Note that our `main` branch tracks the upstream `main` branch:

1. Sync our `main` branch in GitHub using the `sync fork` button.
2. Assuming the NDE development environment is running locally, run `git pull origin main` to pull down our local copy of the upstream `main`.
3. Run `git checkout mit-main` and make sure you have the most recent commits with `git pull origin mit-main`.
4. Create a temporary local branch, e.g., `git checkout -B test-upstream-changes`.
5. Run `git merge main` and confirm that the upstream changes haven't broken anything.
6. Delete your temporary branch.
7. Open a PR to merge our `main` into our `mit-main`.
8. Follow the steps above for testing and deploying to production.


