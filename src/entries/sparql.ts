import { render } from "../components/SparqlQuery";
import { runExtension } from "../entry-helpers";

const ID = "sparql";

runExtension(ID, () => {
  window.roamAlphaAPI.ui.commandPalette.addCommand({
    label: "Run Sparql Query",
    callback: render,
  });
});
