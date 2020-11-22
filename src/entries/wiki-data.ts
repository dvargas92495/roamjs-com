import { renderWikiData } from "../components/WikiData";
import { createButtonObserver, runExtension } from "../entry-helpers";

runExtension("wiki-data", () => {
  createButtonObserver({
    shortcut: "wiki",
    attribute: "wiki-data",
    render: (b: HTMLButtonElement) => {
      debugger;
      renderWikiData(b.closest(".roam-block").id, b.parentElement);
    },
  });
});
