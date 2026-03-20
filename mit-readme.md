# GitHub Repository configurations
## Special Branches
* `mit-main` is our default branch and contains our production code
  * Pushing directly to `main` is disabled by a branch protection rule
* `main` tracks the forked upstream repository's `main` branch at https://github.com/ExLibrisGroup/customModule/tree/main
  * See instructions below for syncing with the forked repository

# Development workflows
## Making style or markup changes
1. If not already installed, clone this repository from GitHub, install the NDE development environment following the instructions in README.md, 
2. Develop and test your changes locally following the instructions in README.MD for using the NDE development environment.
3. Push a branch with your changes to our GitHub repository and open a PR to merge that branch into `mit-main` and request a review
4. Once your PR is reviewed and approved, merge your changes into `mit-main`

## Testing changes as part of code review - An Alma Admin with access to Discovery Configuration must take these steps
1. Clone this repository from GitHub (or just `git pull origin [new-nde-changes]` if you already have our NDE development environment installed locally)
2. If not already installed, install the NDE development environment following the instructions in README.md
3. Switch to the branch being tested `git checkout [new-nde-changes]`
4. **IMPORTANT** - In `build-settings.env` set `VIEW_ID=NDE_DEV`
5. Run the build command `npm run build` following the instructions in README.MD. 
6. As a result of running the build command a new .zip file containing a Primo Customization Package will be created in `/dist`
7. Upload the .zip file to the `NDE_DEV` view via the Alma admin interface following the instructions at https://knowledge.exlibrisgroup.com/Primo/Product_Documentation/020Primo_VE/Primo_VE_(English)/050Display_Configuration/010Configuring_Discovery_Views_for_Primo_VE#Managing_Customization_Packages
8. Test the changes at https://mit.primo.exlibrisgroup.com/nde/home?vid=01MIT_INST:NDE_DEV 


## Deploying to our production NDE view - An Alma Admin with access to Discovery Configuration must take these steps
1. Clone this repository from GitHub (or just `git pull origin mit-main` if you already have a local copy of our NDE development environment installed)
2. If not already installed, install the NDE development environment following the instructions in README.md
3. switch to the production branch `git checkout mit-main`
4. Run the build command `npm run build` following the instructions in README.MD 
5. As a result of running the build command a new .zip file representing a Primo Customization Package will land in `/dist`
6. Upload the .zip file to production NDE view via the Alma admin interface following the instructions at https://knowledge.exlibrisgroup.com/Primo/Product_Documentation/020Primo_VE/Primo_VE_(English)/050Display_Configuration/010Configuring_Discovery_Views_for_Primo_VE#Managing_Customization_Packages

## Syncing with the upstream forked repository.
This repository is forked from https://github.com/ExLibrisGroup/customModule

Take the following steps to sync our local repository with changes from this upstream repository.

Note that our `main` branch tracks the upstream `main` branch:

1. Sync our `main` branch in GitHub using the `sync fork` button 
2. Assuming the NDE development environment is running locally, `git pull origin main` to pull down our local copy of the upstream `main`
3. Confirm that the upstream changes haven't broken anything
4. Open a PR to merge our `main` into our `mit-main` 
5. Follow steps above for testing and deploying to production


