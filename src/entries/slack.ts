import { getUids, getTreeByPageName } from "roam-client";
import {
  createBlockObserver,
  getRefTitlesByBlockUid,
  getTextByBlockUid,
  runExtension,
} from "../entry-helpers";
import { render } from "../components/SlackOverlay";

const ATTRIBUTE = "data-roamjs-slack-overlay";

const getToken = () => {
  const tree = getTreeByPageName("roam/js/slack");
  const tokenNode = tree.find((s) => /token/i.test(s.text.trim()));
  return tokenNode ? tokenNode.children[0].text : "";
};

runExtension("slack", () => {
  const renderSlackOverlay = (container: HTMLDivElement) => {
    const blockUid = getUids(container).blockUid;
    const text = getTextByBlockUid(blockUid);
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
        newSpan.onmousedown = (e: MouseEvent) => e.stopPropagation();
        renderedRef.appendChild(newSpan);
        render({
          parent: newSpan,
          tag: r,
          getToken,
          message: text.replace(`#[[${r}]]`, ""),
        });
      });
    });
  };

  createBlockObserver((b) => renderSlackOverlay(b));
});
