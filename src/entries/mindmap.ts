import {
  createButtonObserver,
  createHTMLObserver,
  getTreeByBlockUid,
  getTreeByPageName,
  toRoamDateUid,
  TreeNode,
} from "roam-client";
import { NODE_CLASSNAME, render } from "../components/MarkmapPanel";
import { addStyle, resolveRefs, runExtension } from "../entry-helpers";

addStyle(`span.${NODE_CLASSNAME} {
  width: 300px;
  display: inline-block;
  word-break: break-word;
  white-space: normal;
}`);

const div = document.createElement("div");

const toMarkdown = ({ c, i }: { c: TreeNode; i: number }): string =>
  `${"".padStart(i * 4, " ")}- ${
    c.heading ? `${"".padStart(c.heading, "#")} ` : ""
  }<span class="${NODE_CLASSNAME} roamjs-block-view" data-block-uid="${c.uid}" id="roamjs-mindmap-node-${c.uid}">${resolveRefs(
    c.text.trim()
  )}</span>${c.children
    .filter((nested) => !!nested.text || nested.children.length)
    .map((nested) => `\n${toMarkdown({ c: nested, i: i + 1 })}`)
    .join("")}`;

const expandEmbeds = (c: TreeNode) => {
  c.children.forEach(expandEmbeds);
  c.text = c.text.replace(
    /({{(?:\[\[)?embed(?:\]\]): \(\((..........?)\)\)}})/,
    (_, __, blockuid) => {
      const newNodes = getTreeByBlockUid(blockuid);
      c.children.push(...newNodes.children);
      return newNodes.text;
    }
  );
};

const replaceTags = (c: TreeNode) => {
  c.children.forEach(replaceTags);
  c.text = c.text.replace(
    /#([\w\d/_-]*)/,
    (_, tag) =>
      `<span class="rm-page-ref--tag" data-tag="${tag}">#${tag}</span>`
  );
};

const hideTagChars = (c: TreeNode) => {
  c.children.forEach(hideTagChars);
  c.text = c.text.replace(/#|\[\[|\]\]/g, "");
};

const getMarkdown = (): string => {
  const match = window.location.href.match("/page/(.*)$");
  const uid = match ? match[1] : toRoamDateUid(new Date());
  const nodes = getTreeByBlockUid(uid).children;
  nodes.forEach((c) => expandEmbeds(c));
  nodes.forEach((c) => replaceTags(c));
  const hideTags = getTreeByPageName("roam/js/mindmap").some((t) =>
    /hide tags/i.test(t.text)
  );
  if (hideTags) {
    nodes.forEach((c) => hideTagChars(c));
  }
  return nodes.map((c) => toMarkdown({ c, i: 0 })).join("\n");
};

runExtension("markmap", () => {
  createHTMLObserver({
    callback: (u: HTMLUListElement) => {
      const lis = Array.from(u.getElementsByTagName("li")).map(
        (l: HTMLLIElement) => l.innerText.trim()
      );
      if (
        lis.includes("Settings") &&
        !u.getAttribute("data-roamjs-has-markmap")
      ) {
        u.setAttribute("data-roamjs-has-markmap", "true");
        u.appendChild(div);
        render({ parent: div, getMarkdown, mode: "menu" });
      }
    },
    tag: "UL",
    className: "bp3-menu",
  });

  createButtonObserver({
    shortcut: "mindmap",
    attribute: "open-mindmap",
    render: (b: HTMLButtonElement) =>
      render({ parent: b.parentElement, getMarkdown, mode: "button" }),
  });
});
