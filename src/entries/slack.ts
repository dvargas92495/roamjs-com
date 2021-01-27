import { getUids } from "roam-client";
import {
  createBlockObserver,
  getRefTitlesByBlockUid,
  getTextTreeByPageName,
  runExtension,
} from "../entry-helpers";
import { render } from "../components/SlackOverlay";

const ATTRIBUTE = "data-roamjs-slack-overlay";

const getUrl = () => {
  const tree = getTextTreeByPageName("roam/js/slack");
  const urlNode = tree.find((s) => /url/i.test(s.text.trim()));
  return urlNode ? urlNode.children[0].text : "";
};

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
        newSpan.style.verticalAlign = "middle";
        renderedRef.appendChild(newSpan);
        render({ parent: newSpan, tag: r, getUrl });
      });
    });
  };

  createBlockObserver((b) => renderSlackOverlay(b));
});
