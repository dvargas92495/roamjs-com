import { createButtonObserver } from "roam-client";
import { runExtension } from "../entry-helpers";
import { render } from "../components/IframelyEmbed";

const ID = "iframely";

runExtension(ID, () => {
  createButtonObserver({
    shortcut: "iframely",
    attribute: "iframely",
    render,
  });
});
