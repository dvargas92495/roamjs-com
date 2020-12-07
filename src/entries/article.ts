import { renderImportArticle } from "../components/ImportArticle";
import {
  createButtonObserver,
  createHTMLObserver,
  runExtension,
} from "../entry-helpers";

runExtension("article", () => {
  createButtonObserver({
    shortcut: "article",
    attribute: "import-article",
    render: (b: HTMLButtonElement) =>
      renderImportArticle(b.closest(".roam-block").id, b.parentElement),
  });

  createHTMLObserver({
    callback: (e) => {
      if (e.previousElementSibling === document.activeElement) {
        console.log("observing!");
      }
    },
    tag: "DIV",
    className: "bp3-elevation-3",
  });
});
