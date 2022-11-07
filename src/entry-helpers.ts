import {
  syncParseRoamBlocksToHtml,
} from "roamjs-components/dom/parseRoamBlocksToHtml";
import { isIOS, isMacOs } from "mobile-device-detect";
import type {
  SidebarWindow,
  TreeNode,
  ViewType,
} from "roamjs-components/types";
import { getParseInline } from "roamjs-components/marked";
import getUids from "roamjs-components/dom/getUids";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import getPageTitleByBlockUid from "roamjs-components/queries/getPageTitleByBlockUid";

// update-block replaces with a new textarea
export const fixCursorById = ({
  id,
  start,
  end,
  focus,
}: {
  id: string;
  start: number;
  end: number;
  focus?: boolean;
}): number =>
  window.setTimeout(() => {
    const textArea = document.getElementById(id) as HTMLTextAreaElement;
    if (focus) {
      textArea.focus();
    }
    textArea.setSelectionRange(start, end);
  }, 100);

export const replaceText = ({
  before,
  after,
  prepend,
}: {
  before: string;
  after: string;
  prepend?: boolean;
}): void => {
  const textArea = document.activeElement as HTMLTextAreaElement;
  const id = textArea.id;
  const oldValue = textArea.value;
  const start = textArea.selectionStart;
  const end = textArea.selectionEnd;
  const text = !before
    ? prepend
      ? `${after} ${oldValue}`
      : `${oldValue}${after}`
    : oldValue.replace(`${before}${!after && prepend ? " " : ""}`, after);
  const { blockUid } = getUids(textArea);
  window.roamAlphaAPI.updateBlock({ block: { string: text, uid: blockUid } });
  const diff = text.length - oldValue.length;
  if (diff !== 0) {
    let index = 0;
    const maxIndex = Math.min(
      Math.max(oldValue.length, text.length),
      Math.max(start, end) + 1
    );
    for (index = 0; index < maxIndex; index++) {
      if (oldValue.charAt(index) !== text.charAt(index)) {
        break;
      }
    }
    const newStart = index > start ? start : start + diff;
    const newEnd = index > end ? end : end + diff;
    if (newStart !== start || newEnd !== end) {
      fixCursorById({
        id,
        start: newStart,
        end: newEnd,
      });
    }
  }
};

export const replaceTagText = ({
  before,
  after,
  addHash = false,
  prepend = false,
}: {
  before: string;
  after: string;
  addHash?: boolean;
  prepend?: boolean;
}): void => {
  if (before) {
    const textArea = document.activeElement as HTMLTextAreaElement;
    if (textArea.value.includes(`#[[${before}]]`)) {
      replaceText({
        before: `#[[${before}]]`,
        after: after ? `#[[${after}]]` : "",
        prepend,
      });
    } else if (textArea.value.includes(`[[${before}]]`)) {
      replaceText({
        before: `[[${before}]]`,
        after: after ? `[[${after}]]` : "",
        prepend,
      });
    } else if (textArea.value.includes(`#${before}`)) {
      const hashAfter = after.match(/(\s|\[\[.*\]\]|[^\x00-\xff])/)
        ? `#[[${after}]]`
        : `#${after}`;
      replaceText({
        before: `#${before}`,
        after: after ? hashAfter : "",
        prepend,
      });
    }
  } else if (addHash) {
    const hashAfter = after.match(/(\s|\[\[.*\]\]|[^\x00-\xff])/)
      ? `#[[${after}]]`
      : `#${after}`;
    replaceText({ before: "", after: hashAfter, prepend });
  } else {
    replaceText({ before: "", after: `[[${after}]]`, prepend });
  }
};

export const getCreatedTimeByTitle = (title: string): number => {
  const result = window.roamAlphaAPI.q(
    `[:find (pull ?e [:create/time]) :where [?e :node/title "${title.replace(
      /"/g,
      '\\"'
    )}"]]`
  )[0][0] as { time: number };
  return result?.time || getEditTimeByTitle(title);
};

export const getEditTimeByTitle = (title: string): number => {
  const result = window.roamAlphaAPI.q(
    `[:find (pull ?e [:edit/time]) :where [?e :node/title "${title.replace(
      /"/g,
      '\\"'
    )}"]]`
  )[0][0] as { time: number };
  return result?.time;
};

export const getWordCount = (str = ""): number =>
  str.trim().split(/\s+/).length;

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

export const getChildrenLengthByPageTitle = (title: string): number =>
  window.roamAlphaAPI.q(
    `[:find ?c :where [?e :block/children ?c] [?e :node/title "${title}"]]`
  ).length;

export const getChildrenLengthByPageUid = (uid: string): number =>
  window.roamAlphaAPI.q(
    `[:find ?c :where [?e :block/children ?c] [?e :block/uid "${uid}"]]`
  ).length;

export const getBlockDepthByBlockUid = (blockUid: string): number => {
  return window.roamAlphaAPI.q(
    `[:find ?p :where [?e :block/parents ?p] [?e :block/uid "${blockUid}"]]`
  ).length;
};

export const getChildRefStringsByBlockUid = (b: string): string[] =>
  window.roamAlphaAPI
    .q(
      `[:find (pull ?r [:block/string]) :where [?e :block/refs ?r] [?e :block/uid "${b}"]]`
    )
    .filter((r) => r.length && r[0])
    .map((r: { string: string }[]) => r[0].string || "");

export const createMobileIcon = (
  id: string,
  iconType: string
): HTMLButtonElement => {
  const iconButton = document.createElement("button");
  iconButton.id = id;
  iconButton.className =
    "bp3-button bp3-minimal rm-mobile-button dont-unfocus-block";
  iconButton.style.padding = "6px 4px 4px;";
  const icon = document.createElement("i");
  icon.className = `zmdi zmdi-hc-fw-rc zmdi-${iconType}`;
  icon.style.cursor = "pointer";
  icon.style.color = "rgb(92, 112, 128)";
  icon.style.fontSize = "18px";
  icon.style.transform = "scale(1.2)";
  icon.style.fontWeight = "1.8";
  icon.style.margin = "8px 4px";
  iconButton.appendChild(icon);
  return iconButton;
};

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

export const BLOCK_REF_REGEX = new RegExp("\\(\\((..........?)\\)\\)", "g");

export const DAILY_NOTE_PAGE_REGEX =
  /(January|February|March|April|May|June|July|August|September|October|November|December) [0-3]?[0-9](st|nd|rd|th), [0-9][0-9][0-9][0-9]/;
export const TODO_REGEX = /{{\[\[TODO\]\]}}/g;
export const DONE_REGEX = /{{\[\[DONE\]\]}} ?/g;
export const createTagRegex = (tag: string): RegExp =>
  new RegExp(`#?\\[\\[${tag}\\]\\]|#${tag}`, "g");

export const extractTag = (tag: string): string =>
  tag.startsWith("#[[") && tag.endsWith("]]")
    ? tag.substring(3, tag.length - 2)
    : tag.startsWith("[[") && tag.endsWith("]]")
    ? tag.substring(2, tag.length - 2)
    : tag.startsWith("#")
    ? tag.substring(1)
    : tag;

export const isPopoverThePageFilter = (popover?: HTMLElement): boolean => {
  if (popover) {
    const strongs = Array.from(popover.getElementsByTagName("strong")).map(
      (e) => e.innerText
    );
    if (strongs.includes("Includes") && strongs.includes("Removes")) {
      const transform = popover.style.transform;
      // this is the only way I know how to differentiate between the two filters
      if (
        transform.startsWith("translate3d(") &&
        transform.endsWith("px, 50px, 0px)")
      ) {
        return true;
      }
    }
  }
  return false;
};

export const getWindowUid = (w: SidebarWindow): string =>
  w.type === "outline"
    ? w["page-uid"]
    : w.type === "mentions"
    ? w["mentions-uid"]
    : w["block-uid"];

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
