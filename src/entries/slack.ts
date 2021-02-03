import { getTreeByPageName, getUids } from "roam-client";
import {
  createHTMLObserver,
  runExtension,
} from "../entry-helpers";
import { getAliases, getUserFormat, render } from "../components/SlackOverlay";

const ATTRIBUTE = "data-roamjs-slack-overlay";

runExtension("slack", () => {
  createHTMLObserver({
    tag: "SPAN",
    className: "rm-page-ref--tag",
    callback: (s: HTMLSpanElement) => {
      if (!s.getAttribute(ATTRIBUTE)) {
        const tree = getTreeByPageName("roam/js/slack");
        const userFormatRegex = new RegExp(
          getUserFormat(tree).replace(/{real name}|{username}/, "(.*)"),
          "i"
        );
        const aliasKeys = new Set(Object.keys(getAliases(tree)));
        const r = s.getAttribute('data-tag');
        if (aliasKeys.size ? aliasKeys.has(r) : userFormatRegex.test(r)) {
          s.setAttribute(ATTRIBUTE, "true");
          const { blockUid } = getUids(
            s.closest(".roam-block") as HTMLDivElement
          );
          const newSpan = document.createElement("span");
          newSpan.style.verticalAlign = "middle";
          newSpan.onmousedown = (e: MouseEvent) => e.stopPropagation();
          s.appendChild(newSpan);
          render({
            parent: newSpan,
            tag: r,
            blockUid,
          });
        }
      }
    },
  });
});
