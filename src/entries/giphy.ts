import { createHTMLObserver, runExtension } from "../entry-helpers";
import { render } from "../components/GiphyPopover";

runExtension("giphy", () => {
  createHTMLObserver({
    tag: "TEXTAREA",
    className: "rm-block-input",
    callback: (t: HTMLTextAreaElement) => {
      render(t);
    },
  });
});
