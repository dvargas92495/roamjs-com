import { createButtonObserver, runExtension } from "../entry-helpers";
import { render } from '../components/AlertButton';

runExtension("alert", () => {
  console.log('running alert');  
  createButtonObserver({
    shortcut: "alert",
    attribute: "alert-button",
    render,
  });
});
