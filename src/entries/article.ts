import { createButtonObserver, runExtension } from "../entry-helpers";

runExtension("article", () => {
  createButtonObserver({
    shortcut: "article",
    attribute: "import-article",
    render: (b: HTMLButtonElement) =>
      renderWikiData(b.closest(".roam-block").id, b.parentElement),
  });
});
