import { toRoamDateUid } from "roam-client";
import { render } from "../components/MarkmapPanel";
import {
  createHTMLObserver,
  getTextTreeByBlockUid,
  resolveRefs,
  runExtension,
  TreeNode,
} from "../entry-helpers";

const div = document.createElement("div");

const toMarkdown = ({ c, i }: { c: TreeNode; i: number }): string =>
  `${"".padStart(i * 4, " ")}- ${
    c.heading ? `${"".padStart(c.heading, "#")} ` : ""
  }${resolveRefs(c.text)}${
    c.open
      ? c.children
          .map((nested) => `\n${toMarkdown({ c: nested, i: i + 1 })}`)
          .join("")
      : ""
  }`;

const getMarkdown = (): string => {
  const match = window.location.href.match("/page/(.*)$");
  const uid = match ? match[1] : toRoamDateUid(new Date());
  const nodes = getTextTreeByBlockUid(uid).children;
  return nodes.map((c) => toMarkdown({ c, i: 0 })).join("\n");
};

runExtension("markmap", () => {
  createHTMLObserver({
    callback: (u: HTMLUListElement) => {
      const lis = Array.from(u.getElementsByTagName("li")).map(
        (l: HTMLLIElement) => l.innerText.trim()
      );
      if (
        lis.includes("Open right sidebar") &&
        !u.getAttribute("data-roamjs-has-markmap")
      ) {
        u.setAttribute("data-roamjs-has-markmap", "true");
        u.appendChild(div);
        render({ parent: div, getMarkdown });
      }
    },
    tag: "UL",
    className: "bp3-menu",
  });
});
