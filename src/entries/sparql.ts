import { createHTMLObserver } from "roam-client";
import { render } from "../components/SparqlQuery";
import { runExtension } from "../entry-helpers";

const ID = "sparql";
const textareaRef: { current: HTMLTextAreaElement } = {
  current: null,
};

runExtension(ID, () => {
  createHTMLObserver({
    tag: "TEXTAREA",
    className: "rm-block-input",
    callback: (t: HTMLTextAreaElement) => (textareaRef.current = t),
  });
  
  window.roamAlphaAPI.ui.commandPalette.addCommand({
    label: "Run SPARQL Query",
    callback: () => render({textareaRef}),
  });
});
