import { createButtonObserver, runExtension } from "../entry-helpers";
import { render } from "../components/Presentation";

runExtension("presentation", () => {
  createButtonObserver({
    attribute: "presentation",
    shortcut: "slides",
    render,
  });
});
