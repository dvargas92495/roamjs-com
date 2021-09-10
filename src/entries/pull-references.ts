import {
  addButtonListener,
  createHTMLObserver,
  getBlockUidFromTarget,
  getConfigFromPage,
  getPageTitleByBlockUid,
  getParentUidByBlockUid,
  getTextByBlockUid,
  pushBullets,
  getTreeByPageName,
  registerSmartBlocksCommand,
  getBlockUidsReferencingPage,
} from "roam-client";
import { DAILY_NOTE_PAGE_REGEX } from "roam-client/lib/date";
import {
  createCustomSmartBlockCommand,
  createTagRegex,
  getLinkedReferences,
  getPageTitle,
  runExtension,
} from "../entry-helpers";
import { render } from "../components/MoveTodoMenu";

const PULL_REFERENCES_COMMAND = "Pull References";
const REPLACE = "${ref}";
const CONFIG = "roam/js/pull-references";

const pullReferences = async (
  pageTitleText = getPageTitle(document.activeElement)?.textContent
) => {
  const config = getConfigFromPage(CONFIG);
  const format = config["Format"] || REPLACE;
  const linkedReferences = getLinkedReferences(pageTitleText);
  const bullets = linkedReferences.map((l) =>
    format.replace(REPLACE, `((${l.uid}))`)
  );
  if (bullets.length === 0) {
    return [`No linked references for ${pageTitleText}!`];
  }

  const removeTags = !!config["Remove Tags"];
  if (removeTags) {
    getBlockUidsReferencingPage(pageTitleText).forEach((blockUid) => {
      const value = getTextByBlockUid(blockUid);
      window.roamAlphaAPI.updateBlock({
        block: {
          string: value.replace(createTagRegex(pageTitleText), ""),
          uid: blockUid,
        },
      });
    });
  }
  return bullets;
};

runExtension("pull-references", () => {
  addButtonListener(PULL_REFERENCES_COMMAND, (_, blockUid) =>
    pullReferences().then((bts) =>
      pushBullets(bts, blockUid, getParentUidByBlockUid(blockUid))
    )
  );

  const isMoveTodoEnabled = getTreeByPageName(CONFIG).some((t) =>
    /move todos/i.test(t.text)
  );
  if (isMoveTodoEnabled) {
    createHTMLObserver({
      tag: "LABEL",
      className: "check-container",
      callback: (l: HTMLLabelElement) => {
        const input = l.getElementsByTagName("input")[0];
        if (!input.checked) {
          const blockUid = getBlockUidFromTarget(input);
          const title = getPageTitleByBlockUid(blockUid);
          if (DAILY_NOTE_PAGE_REGEX.test(title)) {
            const block = input.closest(".roam-block") as HTMLDivElement;
            if (!block.hasAttribute("data-roamjs-move-todo")) {
              block.setAttribute("data-roamjs-move-todo", "true");
              const p = document.createElement("span");
              p.onmousedown = (e) => e.stopPropagation();
              block.appendChild(p);
              render({
                p,
                blockUid,
              });
            }
          }
        }
      },
    });
  }
});

// legacy v1
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

// v2
registerSmartBlocksCommand({
  text: "PULLREFERENCES",
  handler:
    (context: {targetUid: string}) =>
    () =>
      pullReferences(getPageTitleByBlockUid(context.targetUid)),
});
