# Contributing Guide

I am gladly accepting contributions to this project!

## Bug Fixes

1. Please either create an issue explaining the bug (with screesnshots!) or comment on an existing one that you'd like to claim it
1. Fork the repo
1. Create a new branch
1. Fix the bug
1. Include the issue number in your commit message
1. Open a pull request and tag one of the maintainers on the PR
1. After we iterate and approve, feel free to merge!

## Project Cards

1. Edit the card tagging yourself, claiming ownership.
1. Fork the repo
1. Create a new branch
1. Implement the feature mentioned in the card
1. Include the card number in the commit message, which you could get from the card link
1. Open a pull request and tag one of the maintainers on the PR
1. Move the card to "In Progress"
1. After we iterate and approve, feel free to merge!
1. Move the card to "Done"

## New Project Ideas

1. Create an issue explaining the idea, including a general breakdown of tasks needed to implement.
1. After conversation on the github issue resolves, create the project and add card tasks in order of priority
1. Claim the first one you want to work on!

For any other questions, feel free to reach out to me at dvargas92495@gmail.com.

## Local Setup

1. Install npm
	1. `brew install node`
1. Install dependencies
	1. `npm install`
1. Build Project
	1. `npm run build`
1. Serve the JS
	1. `npm install -g http-server`
	1. Run `http-server` in the project dir
1. Change src in roam/js to `http://127.0.0.1:8080/build/${name}.js`
