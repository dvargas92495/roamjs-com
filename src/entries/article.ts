import { renderImportArticle } from "../components/ImportArticle";
import { createButtonObserver, runExtension } from "../entry-helpers";

runExtension({
  extensionId: "article",
  run: () => {
    createButtonObserver({
      shortcut: "article",
      attribute: "import-article",
      render: (b: HTMLButtonElement) =>
        renderImportArticle(b.closest(".roam-block").id, b.parentElement),
    });
  },
});
