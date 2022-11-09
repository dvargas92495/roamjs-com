import { createConfigObserver } from "roamjs-components/components/ConfigPage";
import { NODE_CLASSNAME, render } from "../components/MarkmapPanel";
import { render as imageRender } from "../components/ImagePreview";
import { addStyle } from "../entry-helpers";
import { TreeNode } from "roamjs-components/types/native";
import resolveRefs from "roamjs-components/dom/resolveRefs";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import createButtonObserver from "roamjs-components/dom/createButtonObserver";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import getShallowTreeByParentUid from "roamjs-components/queries/getShallowTreeByParentUid";
import runExtension from "roamjs-components/util/runExtension";
import FlagPanel from "roamjs-components/components/ConfigPanels/FlagPanel";

const CONFIG = "roam/js/mindmap";

addStyle(`span.${NODE_CLASSNAME} {
  width: 300px;
  display: inline-block;
  word-break: break-word;
  white-space: normal;
}

span.${NODE_CLASSNAME} img {
  max-width: 300px;
  max-height: 300px;
}
`);

const div = document.createElement("div");

const toMarkdown = ({ c, i }: { c: TreeNode; i: number }): string =>
  `${"".padStart(i * 4, " ")}- ${
    c.heading ? `${"".padStart(c.heading, "#")} ` : ""
  }<span class="${NODE_CLASSNAME} roamjs-block-view" data-block-uid="${
    c.uid
  }" id="roamjs-mindmap-node-${c.uid}">${resolveRefs(c.text.trim()).replace(
    /\^\^(.*?)\^\^/,
    (_, inner) => `<span class="rm-highlight">${inner}</span>`
  )}</span>${c.children
    .filter((nested) => !!nested.text || nested.children.length)
    .map((nested) => `\n${toMarkdown({ c: nested, i: i + 1 })}`)
    .join("")}`;

const expandEmbeds = (c: TreeNode) => {
  c.children.forEach(expandEmbeds);
  c.text = c.text.replace(
    /({{(?:\[\[)?embed(?:\]\]): \(\((..........?)\)\)}})/,
    (_, __, blockuid) => {
      const newNodes = getFullTreeByParentUid(blockuid);
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

const hideImageText = (c: TreeNode) => {
  c.children.forEach(hideImageText);
  c.text = c.text.replace(/!\[\]\((.*?)\)/, "");
};

const getMarkdown = (): string => {
  const match = window.location.href.match("/page/(.*)$");
  const uid = match
    ? match[1]
    : window.roamAlphaAPI.util.dateToPageUid(new Date());
  const nodes = getFullTreeByParentUid(uid).children;
  nodes.forEach((c) => expandEmbeds(c));
  nodes.forEach((c) => replaceTags(c));
  const config = getShallowTreeByParentUid(getPageUidByPageTitle(CONFIG));
  const hideTags = config.some((t) => /hide tags/i.test(t.text));
  if (hideTags) {
    nodes.forEach((c) => hideTagChars(c));
  }
  const hideImages = config.some((t) => /hide images/i.test(t.text));
  if (hideImages) {
    nodes.forEach((c) => hideImageText(c));
  }
  return nodes.map((c) => toMarkdown({ c, i: 0 })).join("\n");
};

runExtension({
  extensionId: "markmap",
  migratedTo: "workbench",
  run: () => {
    createConfigObserver({
      title: CONFIG,
      config: {
        tabs: [
          {
            id: "home",
            fields: [
              {
                title: "hide tags",
                description: "Whether or not to hide tag syntax from mindmap",
                Panel: FlagPanel,
              },
              {
                title: "hide images",
                description: "Whether or not to filter out images from mindmap",
                Panel: FlagPanel,
              },
            ],
          },
        ],
      },
    });

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

    createHTMLObserver({
      tag: "span",
      className: NODE_CLASSNAME,
      useBody: true,
      callback: (s: HTMLSpanElement) => {
        Array.from(s.getElementsByTagName("img"))
          .filter((i) => !i.hasAttribute("data-roamjs-image-preview"))
          .forEach((i) => {
            const span = document.createElement("span");
            i.parentElement.insertBefore(span, i);
            imageRender({ p: span, src: i.src });
            i.remove();
          });
      },
    });
  },
});
