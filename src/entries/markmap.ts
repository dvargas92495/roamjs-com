import { render } from "../components/MarkmapPanel";
import {
  createHTMLObserver,
  getPageTitle,
  getTextTreeByPageName,
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
  const title = getPageTitle(document.documentElement);
  const nodes = getTextTreeByPageName(title.textContent);
  return nodes.map((c) => toMarkdown({ c, i: 0 })).join("\n");
};

runExtension("markmap", () => {
  createHTMLObserver({
    callback: (u: HTMLUListElement) => {
      if (window.location.href.includes("/page/")) {
        const lis = Array.from(u.getElementsByTagName("li")).map(
          (l: HTMLLIElement) => l.innerText
        );
        if (
          lis.includes("Open right sidebar") &&
          !u.getAttribute("data-roamjs-has-markmap")
        ) {
          u.setAttribute("data-roamjs-has-markmap", "true");
          u.appendChild(div);
          render({ parent: div, getMarkdown });
        }
      }
    },
    tag: "UL",
    className: "bp3-menu",
  });
});
