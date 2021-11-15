import {
  createHTMLObserver,
  getUids,
  ViewType,
  extractRef,
  getBasicTreeByParentUid,
  RoamBasicNode,
  createBlock,
} from "roam-client";
import { renderMouselessDialog } from "../components/MouselessDialog";
import { isControl, runExtension } from "../entry-helpers";

runExtension("mouseless", () => {
  const container = document.createElement("div");
  container.id = "roamjs-mouseless-root";
  document.body.appendChild(container);
  renderMouselessDialog(container as HTMLDivElement);

  const toUidTree = (tree: RoamBasicNode[]): RoamBasicNode[] =>
    tree.map((t) => ({
      text: `((${t.uid}))`,
      children: toUidTree(t.children),
      uid: window.roamAlphaAPI.util.generateUID(),
    }));

  createHTMLObserver({
    callback: (b) => {
      if (b.tabIndex < 0) {
        b.tabIndex = 0;
      }
    },
    tag: "SPAN",
    className: "bp3-button",
  });

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (isControl(e)) {
      if (e.shiftKey) {
        if (e.key === "S") {
          const previousElement = document.activeElement as HTMLElement;
          const emptyShortcuts = document.getElementsByClassName(
            "bp3-button bp3-icon-star-empty"
          ) as HTMLCollectionOf<HTMLSpanElement>;
          const shortcuts = document.getElementsByClassName(
            "bp3-button bp3-icon-star"
          ) as HTMLCollectionOf<HTMLSpanElement>;
          if (emptyShortcuts.length) {
            emptyShortcuts[0].click();
            previousElement?.focus();
          } else if (shortcuts.length) {
            shortcuts[0]?.click();
            previousElement?.focus();
          }
        } else if (e.key === "C") {
          const element = document.activeElement as HTMLElement;
          if (element.tagName === "TEXTAREA") {
            const { blockUid } = getUids(element as HTMLTextAreaElement);
            navigator.clipboard.writeText(`((${blockUid}))`);
            e.preventDefault();
            e.stopPropagation();
          }
        } else if (e.altKey && (e.code === "KeyV" || e.key === "V")) {
          const el = e.target as HTMLElement;
          if (el.nodeName === "TEXTAREA") {
            const ta = el as HTMLTextAreaElement;
            const { blockUid: uid } = getUids(ta);
            if (uid) {
              window.navigator.clipboard.readText().then((clip) => {
                const srcUid = extractRef(clip);
                const tree = getBasicTreeByParentUid(srcUid);
                window.roamAlphaAPI.updateBlock({
                  block: { uid, string: `${ta.value}((${srcUid}))` },
                });
                toUidTree(tree).forEach((t, order) =>
                  createBlock({ parentUid: uid, node: t, order })
                );
              });
              e.preventDefault();
              e.stopPropagation();
            }
          }
        }
      }
    } else if (e.altKey) {
      if (e.code === "KeyV") {
        const el = e.target as HTMLElement;
        if (el.nodeName === "TEXTAREA") {
          const { blockUid: uid } = getUids(el as HTMLTextAreaElement);
          if (uid) {
            const viewType = window.roamAlphaAPI.q(
              `[:find (pull ?b [:children/view-type]) :where [?b :block/uid "${uid}"]]`
            )[0]?.[0]?.["view-type"] as ViewType;
            const newViewType =
              viewType === "document"
                ? "numbered"
                : viewType === "numbered"
                ? "bullet"
                : "document";
            window.roamAlphaAPI.updateBlock({
              block: { uid, "children-view-type": newViewType },
            });
            e.preventDefault();
          }
        }
      }
    } else {
      if (e.key === "Enter") {
        const element = e.target as HTMLElement;
        if (element.className.indexOf("bp3-button") > -1) {
          element.click();
        }
      }
    }
  });
});
