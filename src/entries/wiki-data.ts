import { renderWikiData } from "../components/WikiData";
import { createButtonObserver, runExtension } from "../entry-helpers";

runExtension({
  extensionId: "wiki-data",
  run: () => {
    createButtonObserver({
      shortcut: "wiki",
      attribute: "wiki-data",
      render: (b: HTMLButtonElement) =>
        renderWikiData(b.closest(".roam-block").id, b.parentElement),
    });
  },
});
