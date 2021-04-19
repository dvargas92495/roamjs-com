import { createBlockObserver, createHTMLObserver, getUids } from "roam-client";
import { isControl, runExtension } from "../entry-helpers";

const ID = "multi-select";
const HIGHLIGHT_CLASS = "block-highlight-blue";
const DRAG_CLASS = "block-highlight-grey";
const globalRefs = {
  blocksToMove: [] as string[],
};

runExtension(ID, () => {
  createBlockObserver((d) => {
    const b = d.closest(".roam-block-container") as HTMLDivElement;
    if (b) {
      if (!b.hasAttribute("data-roamjs-multi-select-listener")) {
        b.setAttribute("data-roamjs-multi-select-listener", "true");
        b.addEventListener("mousedown", (e) => {
          if (isControl(e)) {
            if (b.classList.contains(HIGHLIGHT_CLASS)) {
              b.classList.remove(HIGHLIGHT_CLASS);
            } else {
              b.classList.add(HIGHLIGHT_CLASS);
            }
            e.stopPropagation();
          }
        });
      }
    }
  });
  document.addEventListener("mousedown", (e) => {
    const target = e.target as HTMLElement;
    if (
      target.className?.includes?.("rm-bullet__inner") &&
      target
        .closest(".roam-block-container")
        ?.className?.includes?.(HIGHLIGHT_CLASS)
    ) {
      globalRefs.blocksToMove = Array.from(
        document.getElementsByClassName(HIGHLIGHT_CLASS)
      ).map((d) => {
        d.classList.remove(HIGHLIGHT_CLASS);
        d.classList.add(DRAG_CLASS);
        return getUids(
          (d.getElementsByClassName("roam-block")?.[0] as HTMLDivElement) ||
            (d.getElementsByClassName(
              "rm-block-input"
            )?.[0] as HTMLTextAreaElement)
        ).blockUid;
      });
    } else if (
      !isControl(e) ||
      (!target.classList.contains("roam-block-container") &&
        !target.closest(".roam-block-container"))
    ) {
      Array.from(
        document.getElementsByClassName(HIGHLIGHT_CLASS)
      ).forEach((d) => d.classList.remove(HIGHLIGHT_CLASS));
    }
  });
  createHTMLObserver({
    tag: "DIV",
    className: "dnd-drop-area",
    callback: (d) => {
      d.addEventListener("drop", () => {
        const separator = d.parentElement;
        const childrenContainer = separator.parentElement;
        const index = Array.from(childrenContainer.children).findIndex(
          (c) => c === separator
        );
        const offset = Array.from(childrenContainer.children).reduce(
          (prev, cur, ind) =>
            cur.classList.contains("roam-block-container") && ind < index
              ? prev + 1
              : prev,
          0
        );
        const parentBlock = childrenContainer.previousElementSibling.getElementsByClassName(
          "roam-block"
        )?.[0] as HTMLDivElement;
        const parentUid = getUids(parentBlock).blockUid;
        globalRefs.blocksToMove.forEach((uid, order) =>
          window.roamAlphaAPI.moveBlock({
            location: {
              "parent-uid": parentUid,
              order: offset + order,
            },
            block: {
              uid,
            },
          })
        );
        globalRefs.blocksToMove = [];
      });
    },
  });
});
