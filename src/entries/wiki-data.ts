import createButtonObserver from "roamjs-components/dom/createButtonObserver";
import runExtension from "roamjs-components/util/runExtension";
import { renderWikipedia } from "../components/WikiData";

runExtension({
  extensionId: "wiki-data",
  migratedTo: "Wikipedia",
  run: () => {
    createButtonObserver({
      shortcut: "wiki",
      attribute: "wiki-data",
      render: (b: HTMLButtonElement) =>
        renderWikipedia(b.closest(".roam-block").id, b.parentElement),
    });
  },
});
