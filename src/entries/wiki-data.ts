import { renderWikipedia } from "../components/WikiData";
import { runExtension } from "../entry-helpers";
import { createButtonObserver } from "roam-client";

runExtension("wiki-data", () => {
  createButtonObserver({
    shortcut: "wiki",
    attribute: "wiki-data",
    render: (b: HTMLButtonElement) =>
      renderWikipedia(b.closest(".roam-block").id, b.parentElement),
  });
});
