import createButtonObserver from "roamjs-components/dom/createButtonObserver";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import getBlockUidFromTarget from "roamjs-components/dom/getBlockUidFromTarget";
import getPageTitleByBlockUid from "roamjs-components/queries/getPageTitleByBlockUid";
import getParentUidByBlockUid from "roamjs-components/queries/getParentUidByBlockUid";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import createBlock from "roamjs-components/writes/createBlock";
import updateBlock from "roamjs-components/writes/updateBlock";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import registerSmartBlocksCommand from "roamjs-components/util/registerSmartBlocksCommand";
import getBlockUidsReferencingPage from "roamjs-components/queries/getBlockUidsReferencingPage";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import { DAILY_NOTE_PAGE_REGEX } from "roamjs-components/date/constants";
import createTagRegex from "roamjs-components/util/createTagRegex";
import getPageTitleByHtmlElement from "roamjs-components/dom/getPageTitleByHtmlElement";
import runExtension from "roamjs-components/util/runExtension";
import toFlexRegex from "roamjs-components/util/toFlexRegex";
import getBlockUidsAndTextsReferencingPage from "roamjs-components/queries/getBlockUidsAndTextsReferencingPage";
import { render } from "../components/MoveTodoMenu";
import getUidsFromButton from "roamjs-components/dom/getUidsFromButton";
import getOrderByBlockUid from "roamjs-components/queries/getOrderByBlockUid";

const PULL_REFERENCES_COMMAND = "Pull-References";
const REPLACE = "${ref}";
const CONFIG = "roam/js/pull-references";

const pullReferences = async (
  pageTitleText = getPageTitleByHtmlElement(document.activeElement)?.textContent
) => {
  const tree = getBasicTreeByParentUid(getPageUidByPageTitle(CONFIG));
  const config = Object.fromEntries(
    tree
      .map((c) => c.text.split("::").map((s) => s.trim()))
      .filter((s) => s.length === 2)
  ) as Record<string, string>;
  const preFormat = config["Format"] || REPLACE;
  const format = config["Add TODO"] ? `{{[[TODO]]}} ${preFormat}` : preFormat;
  const linkedReferences = getBlockUidsAndTextsReferencingPage(pageTitleText);
  if (linkedReferences.length === 0) {
    return [`No linked references for ${pageTitleText}!`];
  }
  const bullets = linkedReferences.map((l) =>
    format.replace(REPLACE, `((${l.uid}))`)
  );

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
  createButtonObserver({
    attribute: PULL_REFERENCES_COMMAND,
    render: (b) =>
      pullReferences().then((bts) => {
        const { blockUid } = getUidsFromButton(b);
        const parentUid = getParentUidByBlockUid(blockUid);
        const order = getOrderByBlockUid(blockUid);
        return Promise.all([
          updateBlock({ text: bts[0], uid: blockUid }),
          ...bts
            .slice(1)
            .map((text, o) =>
              createBlock({ parentUid, order: o + order + 1, node: { text } })
            ),
        ]);
      }),
  });

  const isMoveTodoEnabled = getBasicTreeByParentUid(
    getPageUidByPageTitle(CONFIG)
  ).find((t) => toFlexRegex("move todos").test(t.text));
  const isMoveTagEnabled = getBasicTreeByParentUid(
    getPageUidByPageTitle(CONFIG)
  ).find((t) => toFlexRegex("move tags").test(t.text));
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
            if (!block.hasAttribute("data-roamjs-move-ref")) {
              block.setAttribute("data-roamjs-move-ref", "true");
              const p = document.createElement("span");
              p.onmousedown = (e) => e.stopPropagation();
              block.appendChild(p);
              render({
                p,
                blockUid,
                archivedDefault: toFlexRegex("archived").test(
                  isMoveTodoEnabled.children[0]?.text
                ),
              });
            }
          }
        }
      },
    });
  } 
  if (isMoveTagEnabled) {
    createHTMLObserver({
      tag: "SPAN",
      className: "rm-page-ref",
      callback: (s: HTMLSpanElement) => {
        const blockUid = getBlockUidFromTarget(s);
        const title = getPageTitleByBlockUid(blockUid);
        if (DAILY_NOTE_PAGE_REGEX.test(title)) {
          const block = s.closest(".roam-block") as HTMLDivElement;
          if (!block.hasAttribute("data-roamjs-move-ref")) {
            block.setAttribute("data-roamjs-move-ref", "true");
            const p = document.createElement("span");
            p.onmousedown = (e) => e.stopPropagation();
            block.appendChild(p);
            render({
              p,
              blockUid,
              archivedDefault: toFlexRegex("archived").test(
                isMoveTodoEnabled.children[0]?.text
              )
            });
          }
        }
      },
    });
  }
});

registerSmartBlocksCommand({
  text: "PULLREFERENCES",
  handler: (context: { targetUid: string }) => () =>
    pullReferences(
      getPageTitleByBlockUid(context.targetUid) ||
        getPageTitleByPageUid(context.targetUid)
    ),
});
