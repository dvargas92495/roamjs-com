import { getUids } from "roam-client";
import {
  createBlockObserver,
  getRefTitlesByBlockUid,
  runExtension,
} from "../entry-helpers";
import { render } from "../components/SlackOverlay";

const ATTRIBUTE = "data-roamjs-slack-overlay";

runExtension("slack", () => {
  const renderSlackOverlay = (container: HTMLDivElement) => {
    const blockUid = getUids(container).blockUid;
    const refs = getRefTitlesByBlockUid(blockUid);
    const renderedRefs = Array.from(
      container.getElementsByClassName("rm-page-ref--tag")
    );
    refs.forEach((r) => {
      const renderedRefSpans = renderedRefs.filter(
        (s) => s.getAttribute("data-tag") === r && !s.getAttribute(ATTRIBUTE)
      );
      renderedRefSpans.forEach((renderedRef) => {
        const newSpan = document.createElement("span");
        renderedRef.appendChild(newSpan);
        render({ parent: newSpan, tag: r });
      });
    });
  };

  createBlockObserver((b) => renderSlackOverlay(b));
});
