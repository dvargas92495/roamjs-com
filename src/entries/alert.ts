import { createButtonObserver, runExtension } from "../entry-helpers";
import { render } from '../components/AlertButton';

runExtension("alert", () => {
  createButtonObserver({
    shortcut: "alert",
    attribute: "alert-button",
    render,
  });
});
