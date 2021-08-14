import { createHTMLObserver, getUids } from "roam-client";
import { renderMouselessDialog } from "../components/MouselessDialog";
import { isControl, runExtension } from "../entry-helpers";

runExtension("mouseless", () => {
  const container = document.createElement("div");
  container.id = "roamjs-mouseless-root";
  document.body.appendChild(container);
  renderMouselessDialog(container as HTMLDivElement);

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
