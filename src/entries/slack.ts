import { getTreeByPageName, getUids } from "roam-client";
import { createHashtagObserver, runExtension } from "../entry-helpers";
import {
  getAliases,
  getChannelFormat,
  getUserFormat,
  render,
} from "../components/SlackOverlay";

runExtension("slack", () => {
  createHashtagObserver({
    attribute: "data-roamjs-slack-overlay",
    callback: (s: HTMLSpanElement) => {
      const tree = getTreeByPageName("roam/js/slack");
      const userFormatIsDefault = tree.every(
        (t) => !/user format/i.test(t.text.trim())
      );
      const channelFormatIsDefault = tree.every(
        (t) => !/channel format/i.test(t.text.trim())
      );
      const userFormatRegex = new RegExp(
        getUserFormat(tree).replace(/{real name}|{username}/, "(.*)"),
        "i"
      );
      const channelFormatRegex = new RegExp(
        getChannelFormat(tree).replace(/{channel}/, "(.*)"),
        "i"
      );
      const aliasKeys = new Set(Object.keys(getAliases(tree)));
      const r = s.getAttribute("data-tag");
      if (
        aliasKeys.size
          ? aliasKeys.has(r) ||
            (!userFormatIsDefault && userFormatRegex.test(r)) ||
            (!channelFormatIsDefault && channelFormatRegex.test(r))
          : userFormatRegex.test(r) || channelFormatRegex.test(r)
      ) {
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
    },
  });
});
