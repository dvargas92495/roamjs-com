import { createButtonObserver, runExtension } from "../entry-helpers";
import { render } from "../components/Maps";

runExtension("maps", () => {
  createButtonObserver({
    shortcut: "maps",
    attribute: "leaflet",
    render,
  });
});
