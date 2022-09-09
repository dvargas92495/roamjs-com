import createButtonObserver from "roamjs-components/dom/createButtonObserver";
import runExtension from "roamjs-components/util/runExtension";
import { render } from "../components/Maps";

runExtension("maps", () => {
  createButtonObserver({
    shortcut: "maps",
    attribute: "leaflet",
    render,
  });
});
