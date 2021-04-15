import {
  addButtonListener,
  getConfigFromPage,
  getParentUidByBlockUid,
  getTextByBlockUid,
  getUidsFromId,
  pushBullets,
} from "roam-client";
import {
  createCustomSmartBlockCommand,
  createTagRegex,
  getLinkedReferences,
  getPageTitle,
  runExtension,
} from "../entry-helpers";

const PULL_REFERENCES_COMMAND = "Pull References";
const REPLACE = "${ref}";

const pullReferences = async () => {
  const config = getConfigFromPage("roam/js/pull-references");
  const format = config["Format"] || REPLACE;
  const pageTitle = getPageTitle(document.activeElement);
  const pageTitleText = pageTitle.textContent;
  const linkedReferences = getLinkedReferences(pageTitleText);
  const bullets = linkedReferences.map((l) =>
    format.replace(REPLACE, `((${l.uid}))`)
  );
  if (bullets.length === 0) {
    return ["No linked references for this page!"];
  }

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
  return bullets;
};

runExtension("pull-references", () => {
  addButtonListener(PULL_REFERENCES_COMMAND, (_, blockUid) =>
    pullReferences().then((bts) =>
      pushBullets(bts, blockUid, getParentUidByBlockUid(blockUid))
    )
  );
});

createCustomSmartBlockCommand({
  command: "PULLREFERENCES",
  processor: async () =>
    pullReferences().then(async (bullets) => {
      bullets.forEach((s) =>
        window.roam42.smartBlocks.activeWorkflow.outputAdditionalBlock(s)
      );
      return "";
    }),
});
