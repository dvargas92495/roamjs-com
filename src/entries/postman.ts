import {
  createHashtagObserver,
  getPageUidByPageTitle,
  getTreeByPageName,
  getUids,
} from "roam-client";
import { render } from "../components/PostmanOverlay";
import { extractTag, runExtension } from "../entry-helpers";

const APIS_REGEX = /apis/i;

type TextNode = {
  text: string;
  children: TextNode[];
};

const createBlock = ({
  node,
  parentUid,
  order,
}: {
  node: TextNode;
  parentUid: string;
  order: number;
}) => {
  const uid = window.roamAlphaAPI.util.generateUID();
  window.roamAlphaAPI.createBlock({
    location: { "parent-uid": parentUid, order },
    block: { uid, string: node.text },
  });
  node.children.forEach((n, o) =>
    createBlock({ node: n, parentUid: uid, order: o })
  );
};

const createPage = ({ title, tree }: { title: string; tree: TextNode[] }) => {
  const uid = window.roamAlphaAPI.util.generateUID();
  window.roamAlphaAPI.createPage({ page: { title, uid } });
  tree.forEach((node, order) => createBlock({ node, parentUid: uid, order }));
};

runExtension("postman", () => {
  if (!getPageUidByPageTitle("roam/js/postman")) {
    createPage({
      title: "roam/js/postman",
      tree: [
        {
          text: "apis",
          children: [
            {
              text: "PostmanExample",
              children: [
                {
                  text: "url",
                  children: [
                    { text: "https://lambda.roamjs.com/postman", children: [] },
                  ],
                },
                {
                  text: "body",
                  children: [
                    { text: "foo", children: [{ text: "bar", children: [] }] },
                    {
                      text: "body_content",
                      children: [{ text: "Contents: {block}", children: [] }],
                    },
                    {
                      text: "tree_content",
                      children: [{ text: "{tree}", children: [] }],
                    },
                  ],
                },
                {
                  text: "headers",
                  children: [
                    {
                      text: "Content-Type",
                      children: [{ text: "application/json", children: [] }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  }
  createHashtagObserver({
    attribute: "data-roamjs-postman",
    callback: (s: HTMLSpanElement) => {
      const tree = getTreeByPageName("roam/js/postman");
      const tag = s.getAttribute("data-tag");
      const apis = tree.find((t) => APIS_REGEX.test(t.text)).children;
      const api = apis.find(
        (a) => tag.toUpperCase() === extractTag(a.text.trim()).toUpperCase()
      );
      if (api) {
        const { blockUid } = getUids(
          s.closest(".roam-block") as HTMLDivElement
        );
        const p = document.createElement("span");
        p.style.verticalAlign = "middle";
        p.onmousedown = (e: MouseEvent) => e.stopPropagation();
        s.appendChild(p);
        render({
          p,
          apiUid: api.uid,
          blockUid,
        });
      }
    },
  });
});
