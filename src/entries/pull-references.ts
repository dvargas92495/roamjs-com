import { addButtonListener, getPageTitle } from "../entry-helpers";

const PULL_REFERENCES_COMMAND = "Pull References";

const pullReferences = () => {
  const pageTitle = getPageTitle(document.activeElement);
  console.log("Pull references for", pageTitle);
};

addButtonListener(PULL_REFERENCES_COMMAND, pullReferences);
