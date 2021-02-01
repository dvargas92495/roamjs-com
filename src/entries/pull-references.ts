import {
  addButtonListener,
  getConfigFromPage,
  getParentUidByBlockUid,
  getTextByBlockUid,
  getUidsFromId,
  pushBullets,
} from "roam-client";
import {
  createTagRegex,
  getLinkedReferences,
  getPageTitle,
  runExtension,
} from "../entry-helpers";

const PULL_REFERENCES_COMMAND = "Pull References";
const REPLACE = "${ref}";

const pullReferences = async (
  _: {
    [key: string]: string;
  },
  blockUid: string
) => {
  const parentUid = getParentUidByBlockUid(blockUid);
  const config = getConfigFromPage("roam/js/pull-references");
  const format = config["Format"] || REPLACE;
  const pageTitle = getPageTitle(document.activeElement);
  const pageTitleText = pageTitle.textContent;
  const linkedReferences = getLinkedReferences(pageTitleText);
  const bullets = linkedReferences.map((l) =>
    format.replace(REPLACE, `((${l.uid}))`)
  );
  if (bullets.length === 0) {
    window.roamAlphaAPI.updateBlock({
      block: { string: "No linked references for this page!", uid: blockUid },
    });
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
    for (let b = 0; b < blockReferenceIds.length; b++) {
      const { blockUid } = getUidsFromId(blockReferenceIds[b]);
      const value = getTextByBlockUid(blockUid);
      window.roamAlphaAPI.updateBlock({
        block: {
          string: value.replace(createTagRegex(pageTitleText), ""),
          uid: blockUid,
        },
      });
    }
  }
};

runExtension("pull-references", () => {
  addButtonListener(PULL_REFERENCES_COMMAND, pullReferences);
});
