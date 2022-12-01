import { syncParseRoamBlocksToHtml } from "roamjs-components/dom/parseRoamBlocksToHtml";
import { isIOS, isMacOs } from "mobile-device-detect";
import type { TreeNode, ViewType } from "roamjs-components/types/native";
import { getParseInline } from "roamjs-components/marked";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import getPageTitleByBlockUid from "roamjs-components/queries/getPageTitleByBlockUid";

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
