import { runExtension } from "../entry-helpers";
import { render } from "../components/Maps";
import { createButtonObserver } from "roam-client";

runExtension("maps", () => {
  createButtonObserver({
    shortcut: "maps",
    attribute: "leaflet",
    render,
  });
});
