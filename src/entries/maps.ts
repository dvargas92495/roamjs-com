import createButtonObserver from "roamjs-components/dom/createButtonObserver";
import runExtension from "roamjs-components/util/runExtension";
import { render } from "../components/Maps";

runExtension({
  extensionId: "maps",
  migratedTo: "MapBox",
  run: () => {
    createButtonObserver({
      shortcut: "maps",
      attribute: "leaflet",
      render,
    });
  },
});
