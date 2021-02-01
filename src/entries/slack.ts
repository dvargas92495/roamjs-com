import { getTreeByPageName, getUids } from "roam-client";
import {
  createBlockObserver,
  getRefTitlesByBlockUid,
  getTextByBlockUid,
  runExtension,
} from "../entry-helpers";
import { getAliases, getUserFormat, render } from "../components/SlackOverlay";

const ATTRIBUTE = "data-roamjs-slack-overlay";

runExtension("slack", () => {
  const renderSlackOverlay = (container: HTMLDivElement) => {
    const blockUid = getUids(container).blockUid;
    const refs = getRefTitlesByBlockUid(blockUid);
    if (refs.length) {
      const text = getTextByBlockUid(blockUid);
      const tree = getTreeByPageName("roam/js/slack");
      const userFormatRegex = new RegExp(
        getUserFormat(tree).replace("{real name}|{username}", "(.*)"),
        "i"
      );
      const aliasKeys = new Set(Object.keys(getAliases(tree)));
      const filteredRefs = refs.filter(
        (r) => aliasKeys.has(r) || userFormatRegex.test(r)
      );
      const renderedRefs = Array.from(
        container.getElementsByClassName("rm-page-ref--tag")
      );
      filteredRefs.forEach((r) => {
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
            message: text,
          });
        });
      });
    }
  };

  createBlockObserver((b) => renderSlackOverlay(b));
});
