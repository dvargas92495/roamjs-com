import userEvent from "@testing-library/user-event";
import {
  addButtonListener,
  asyncType,
  getConfigFromPage,
  openBlock,
  pushBullets,
} from "roam-client";
import { getLinkedReferences, getPageTitle } from "../entry-helpers";

const PULL_REFERENCES_COMMAND = "Pull References";
const REPLACE = "${ref}";

const pullReferences = async (_: any, blockUid: string, parentUid: string) => {
  const config = getConfigFromPage("roam/js/pull-references");
  const format = config["Format"] || REPLACE;
  const pageTitle = getPageTitle(document.activeElement);
  const pageTitleText = pageTitle.textContent;
  const linkedReferences = getLinkedReferences(pageTitleText);
  const bullets = linkedReferences.map((l) =>
    format.replace(REPLACE, `((${l.uid}))`)
  );
  if (bullets.length === 0) {
    await asyncType("No linked references for this page!");
    return;
  }
  await pushBullets(bullets, blockUid, parentUid);

  const removeTags = !!config["Remove Tags"];
  if (removeTags && !document.activeElement.closest(".rm-sidebar-outline")) {
    const container =
      pageTitle.parentElement.closest(".roam-log-page") || document;
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
      const removeTag = async (s: string) => {
        const index = value.indexOf(s);
        if (index >= 0) {
          textArea.setSelectionRange(index, index + s.length);
          await userEvent.type(textArea, "{backspace}");
        }
      };
      await removeTag(`#[[${pageTitleText}]]`);
      await removeTag(`[[${pageTitleText}]]`);
      await removeTag(`#${pageTitleText}`);
    }
  }
};

addButtonListener(PULL_REFERENCES_COMMAND, pullReferences);
