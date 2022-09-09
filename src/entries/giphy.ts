import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import runExtension from "roamjs-components/util/runExtension";
import { render } from "../components/GiphyPopover";

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
