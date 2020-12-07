import userEvent from "@testing-library/user-event";
import { asyncPaste, newBlockEnter } from "roam-client";
import urlRegex from "url-regex";
import { importArticle, renderImportArticle } from "../components/ImportArticle";
import {
  createButtonObserver,
  runExtension,
} from "../entry-helpers";

runExtension("article", () => {
  createButtonObserver({
    shortcut: "article",
    attribute: "import-article",
    render: (b: HTMLButtonElement) =>
      renderImportArticle(b.closest(".roam-block").id, b.parentElement),
  });

  document.addEventListener("keydown", async (e) => {
    if (e.altKey && e.shiftKey && e.key === "I") {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") {
        const textarea = target as HTMLTextAreaElement;
        const match = textarea.value.match(urlRegex({ strict: true }));
        if (match) {
          const url = match[0];
          await newBlockEnter();
          await userEvent.tab();
          await asyncPaste('Loading...');
          await importArticle({ url, blockId: document.activeElement.id }) 
        }
      }
    }
  });
});
