import { getConfigFromPage, pushBullets } from "roam-client";
import {
  addButtonListener,
  getLinkedReferences,
  getPageTitle,
} from "../entry-helpers";

const PULL_REFERENCES_COMMAND = "Pull References";
const REPLACE = "${ref}";

const pullReferences = async (_: any, blockUid: string, parentUid: string) => {
  const config = getConfigFromPage("roam/js/pull-references");
  const format = config["Format"] || REPLACE;
  const pageTitle = getPageTitle(document.activeElement);
  const linkedReferences = getLinkedReferences(pageTitle.innerText);
  const bullets = linkedReferences.map((l) =>
    format.replace(REPLACE, `((${l.uid}))`)
  );
  await pushBullets(bullets, blockUid, parentUid);
};

addButtonListener(PULL_REFERENCES_COMMAND, pullReferences);
