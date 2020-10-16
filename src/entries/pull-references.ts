import userEvent from "@testing-library/user-event";
import { getConfigFromPage, pushBullets } from "roam-client";
import {
  addButtonListener,
  getLinkedReferences,
  getPageTitle,
  openBlock,
} from "../entry-helpers";

const PULL_REFERENCES_COMMAND = "Pull References";
const REPLACE = "${ref}";

const pullReferences = async (_: any, blockUid: string, parentUid: string) => {
  const config = getConfigFromPage("roam/js/pull-references");
  const format = config["Format"] || REPLACE;
  const pageTitle = getPageTitle(document.activeElement);
  const pageTitleText = pageTitle.innerText;
  const linkedReferences = getLinkedReferences(pageTitleText);
  const bullets = linkedReferences.map((l) =>
    format.replace(REPLACE, `((${l.uid}))`)
  );
  await pushBullets(bullets, blockUid, parentUid);

  const removeTags = !!config["Remove Tags"];
  if (removeTags) {
    const container = pageTitle.closest(".roam-log-page") || document;
    const blockReferences = Array.from(
      container.getElementsByClassName("rm-reference-main")
    )
      .find((d) => d.className.indexOf("rm-query-content") < 0)
      .getElementsByClassName("roam-block");
    const blockReferenceIds = Array.from(blockReferences).map((b) => b.id);
    for (var b = 0; b < blockReferenceIds.length; b++) {
      const block = document.getElementById(blockReferenceIds[b]);
      await openBlock(block);
      const textArea = document.activeElement as HTMLTextAreaElement;
      const value = textArea.value;
      const index = value.indexOf(`[[${pageTitleText}]]`);
      if (index >= 0) {
        textArea.setSelectionRange(index, index + 4 + pageTitleText.length);
        await userEvent.type(textArea, "{backspace}");
      }
    }
  }
};

addButtonListener(PULL_REFERENCES_COMMAND, pullReferences);
