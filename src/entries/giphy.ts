import { runExtension } from "../entry-helpers";
import { render } from "../components/GiphyPopover";
import { createHTMLObserver } from "roam-client";

runExtension("giphy", () => {
  createHTMLObserver({
    tag: "TEXTAREA",
    className: "rm-block-input",
    callback: (t: HTMLTextAreaElement) => {
      render(t);
    },
    removeCallback: () =>
      Array.from(
        document.getElementsByClassName("roamjs-giphy-portal")
      ).forEach((p) =>
        p.parentElement.parentElement.removeChild(p.parentElement)
      ),
  });
});
