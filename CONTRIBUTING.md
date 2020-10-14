# Contributing Guide

I am gladly accepting contributions to this project!

## Issues

1. Please either create an issue explaining the bug (with screesnshots!) or comment on an existing one that you'd like to claim it
1. Fork the repo
1. Create a new branch
1. Fix the bug
1. Include the issue number in your commit message.
    1. For Example: "Fixes the UI bug (Closes #70)"
1. Open a pull request and tag one of the maintainers on the PR
1. After we iterate and approve, we'll merge!

Any new issues created should be added to either the [Extension Maintenance](https://github.com/dvargas92495/roam-js-extensions/projects/9) project if it's specific to an extension or the [General Improvements](https://github.com/dvargas92495/roam-js-extensions/projects/4) project if more generic.

## Projects

1. Create an issue explaining the idea, including a general breakdown of tasks needed to implement.
1. After conversation on the github issue resolves, create the project as an automated kanban.
1. Create the tasks needed to complete the project as issues, filling in the right project in the project field.
1. Claim the first one you want to work on!

## Project Breakdown
Here are the important directories to keep in mind:

1. `docs` - Where all of the documentation for the project is stored
1. `src/entries` - Where all of the extensions are stored
1. `src/apis` - Any extensions that need backend logic or secrets like an API key store it's lambdas here
1. `src/automations` - Extensions that run automatically and use Roam's backend API
1. `src/entry-helpers.ts` - Common utility functions that extensions used. Am in the middle of migrating to [here](https://www.npmjs.com/package/roam-client).

For any new extension added, please also added a new page in the docs that describe the behavior of the extension.

For any other questions, feel free to reach out to me at dvargas92495@gmail.com.

## Local Setup

1. Install npm
	1. `brew install node`
1. Install dependencies
	1. `npm install`
1. Serve the JS
	1. `npm run local`
1. Change src in roam/js to `http://127.0.0.1:8080/build/${name}.js`
