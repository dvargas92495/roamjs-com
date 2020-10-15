import { addButtonListener, getLinkedReferences, getPageTitle } from "../entry-helpers";

const PULL_REFERENCES_COMMAND = "Pull References";

const pullReferences = () => {
  const pageTitle = getPageTitle(document.activeElement);
  const linkedReferences = getLinkedReferences(pageTitle.innerText);
  console.log("Pulled references", linkedReferences.map(l => l.title));
};

addButtonListener(PULL_REFERENCES_COMMAND, pullReferences);
