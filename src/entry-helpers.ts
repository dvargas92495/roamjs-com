import { syncParseRoamBlocksToHtml } from "roamjs-components/dom/parseRoamBlocksToHtml";
import { isIOS, isMacOs } from "mobile-device-detect";
import type { TreeNode, ViewType } from "roamjs-components/types/native";
import { getParseInline } from "roamjs-components/marked";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import getPageTitleByBlockUid from "roamjs-components/queries/getPageTitleByBlockUid";

export const isTagOnPage = ({
  tag,
  title,
}: {
  tag: string;
  title: string;
}): boolean =>
  !!window.roamAlphaAPI.q(
    `[:find ?r :where [?r :node/title "${tag}"] [?b :block/refs ?r] [?b :block/page ?p] [?p :node/title "${title.replace(
      /"/g,
      '\\"'
    )}"]]`
  )?.[0]?.[0];

const isApple = isIOS || isMacOs;

export const isControl = (e: KeyboardEvent | MouseEvent): boolean =>
  (e.ctrlKey && !isApple) || (e.metaKey && isApple);

export const addStyle = (content: string): HTMLStyleElement => {
  const css = document.createElement("style");
  css.textContent = content;
  document.getElementsByTagName("head")[0].appendChild(css);
  return css;
};

const getRoamUrl = (blockUid?: string): string =>
  `${window.location.href.replace(/\/page\/.*$/, "")}${
    blockUid ? `/page/${blockUid}` : ""
  }`;

export const extractTag = (tag: string): string =>
  tag.startsWith("#[[") && tag.endsWith("]]")
    ? tag.substring(3, tag.length - 2)
    : tag.startsWith("[[") && tag.endsWith("]]")
    ? tag.substring(2, tag.length - 2)
    : tag.startsWith("#")
    ? tag.substring(1)
    : tag;

export const openBlock = (blockId?: string): void =>
  openBlockElement(document.getElementById(blockId));

export const openBlockElement = (block: HTMLElement): void => {
  block.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  setTimeout(() => {
    const textArea = document.getElementById(block.id) as HTMLTextAreaElement;
    if (textArea?.tagName === "TEXTAREA") {
      textArea.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      textArea.setSelectionRange(textArea.value.length, textArea.value.length);
    }
  }, 50);
};

const context = {
  pagesToHrefs: (page: string, ref?: string) =>
    ref ? getRoamUrl(ref) : getRoamUrl(getPageUidByPageTitle(page)),
  blockReferences: (ref: string) => ({
    text: getTextByBlockUid(ref),
    page: getPageTitleByBlockUid(ref),
  }),
  components: (): false => {
    return false;
  },
};

export const getParseRoamMarked = (): Promise<(s: string) => string> =>
  getParseInline().then(
    (parseInline) => (text: string) => parseInline(text, context)
  );

export const getParseRoamBlocks = (): Promise<
  (a: { content: TreeNode[]; viewType: ViewType }) => string
> =>
  getParseInline().then(
    (parseInline) => (args: { content: TreeNode[]; viewType: ViewType }) =>
      syncParseRoamBlocksToHtml({
        ...args,
        level: 0,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        context,
        parseInline,
      })
  );
