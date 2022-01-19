import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import getUids from "roamjs-components/dom/getUids";
import type {
  ViewType,
  RoamBasicNode,
  InputTextNode,
} from "roamjs-components/types";
import extractRef from "roamjs-components/util/extractRef";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import createBlock from "roamjs-components/writes/createBlock";
import { renderMouselessDialog } from "../components/MouselessDialog";
import runExtension from "roamjs-components/util/runExtension";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import { BLOCK_REF_REGEX } from "roamjs-components/dom/constants";
import updateBlock from "roamjs-components/writes/updateBlock";
import getOrderByBlockUid from "roamjs-components/queries/getOrderByBlockUid";
import getParentUidByBlockUid from "roamjs-components/queries/getParentUidByBlockUid";

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

  const stripUid = (tree: RoamBasicNode[]): InputTextNode[] =>
    tree.map(({ uid: _, children, ...t }) => ({
      ...t,
      children: stripUid(children),
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
    if (e.ctrlKey) {
      if (e.shiftKey) {
        if (e.altKey && (e.code === "KeyV" || e.key === "V")) {
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
        } else if (e.altKey && (e.code === "KeyA" || e.key === "A")) {
          const el = e.target as HTMLElement;
          if (el.nodeName === "TEXTAREA") {
            const ta = el as HTMLTextAreaElement;
            const { blockUid: uid } = getUids(ta);
            if (uid) {
              const text = getTextByBlockUid(uid);
              const allRefs = Array.from(
                text.matchAll(new RegExp(BLOCK_REF_REGEX, "g"))
              );
              if (allRefs.length) {
                const latestMatch = allRefs.findIndex(
                  (r) => r.index > ta.selectionStart
                );
                const refMatch =
                  latestMatch <= 0 ? allRefs[0] : allRefs[latestMatch - 1];
                const refText = getTextByBlockUid(refMatch[1]);
                const prefix = `${text.slice(
                  0,
                  refMatch.index
                )}${refText} [*](${refMatch[0]})`;
                const location = window.roamAlphaAPI.ui.getFocusedBlock();
                updateBlock({
                  text: `${prefix} ${text.slice(
                    refMatch.index + refMatch[0].length
                  )}`,
                  uid,
                }).then(() =>
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore remove roam-client
                  window.roamAlphaAPI.ui.setBlockFocusAndSelection({
                    location,
                    selection: { start: prefix.length },
                  })
                );
              }
            }
          }
        } else if (e.altKey && (e.code === "KeyC" || e.key === "C")) {
          const el = e.target as HTMLElement;
          if (el.nodeName === "TEXTAREA") {
            const ta = el as HTMLTextAreaElement;
            const { blockUid: uid } = getUids(ta);
            if (uid) {
              const text = getTextByBlockUid(uid);
              const allRefs = Array.from(
                text.matchAll(new RegExp(BLOCK_REF_REGEX, "g"))
              );
              if (allRefs.length) {
                const latestMatch = allRefs.findIndex(
                  (r) => r.index > ta.selectionStart
                );
                const refMatch =
                  latestMatch <= 0 ? allRefs[0] : allRefs[latestMatch - 1];
                const tree = getBasicTreeByParentUid(refMatch[1]);
                stripUid(tree).forEach((node, order) =>
                  createBlock({ parentUid: uid, order, node })
                );
              }
            }
          }
        } else if (e.altKey && (e.code === "KeyO" || e.key === "O")) {
          const el = e.target as HTMLElement;
          if (el.nodeName === "TEXTAREA") {
            const ta = el as HTMLTextAreaElement;
            const { blockUid: uid } = getUids(ta);
            if (uid) {
              const text = getTextByBlockUid(uid);
              const allRefs = Array.from(
                text.matchAll(new RegExp(BLOCK_REF_REGEX, "g"))
              );
              if (allRefs.length) {
                const latestMatch = allRefs.findIndex(
                  (r) => r.index > ta.selectionStart
                );
                const refMatch =
                  latestMatch <= 0 ? allRefs[0] : allRefs[latestMatch - 1];
                const refOrder = getOrderByBlockUid(refMatch[1]);
                const refParent = getParentUidByBlockUid(refMatch[1]);
                const sourceOrder = getOrderByBlockUid(uid);
                const sourceParent = getParentUidByBlockUid(uid);
                window.roamAlphaAPI.moveBlock({
                  location: { "parent-uid": refParent, order: refOrder },
                  block: { uid },
                });
                window.roamAlphaAPI.moveBlock({
                  location: { "parent-uid": sourceParent, order: sourceOrder },
                  block: { uid: refMatch[1] },
                });
              }
            }
          }
        } else if (e.altKey && (e.code === "KeyM" || e.key === "M")) {
          const el = e.target as HTMLElement;
          if (el.nodeName === "TEXTAREA") {
            const ta = el as HTMLTextAreaElement;
            const { blockUid: uid } = getUids(ta);
            if (uid) {
              const text = getTextByBlockUid(uid);
              const allRefs = Array.from(
                text.matchAll(new RegExp(BLOCK_REF_REGEX, "g"))
              );
              if (allRefs.length) {
                const latestMatch = allRefs.findIndex(
                  (r) => r.index > ta.selectionStart
                );
                const refMatch =
                  latestMatch <= 0 ? allRefs[0] : allRefs[latestMatch - 1];
                  console.log('comment on', refMatch[1]);
              }
            }
          }
        } else if (e.key === "S") {
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
