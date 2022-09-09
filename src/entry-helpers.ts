import {
  syncParseRoamBlocksToHtml,
} from "roamjs-components/dom/parseRoamBlocksToHtml";
import { isIOS, isMacOs } from "mobile-device-detect";
import { Dict } from "mixpanel-browser";
import axios, { AxiosResponse } from "axios";
import type {
  SidebarWindow,
  TreeNode,
  ViewType,
} from "roamjs-components/types";
import { getParseInline } from "roamjs-components/marked";
import getUids from "roamjs-components/dom/getUids";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import createIconButton from "roamjs-components/dom/createIconButton";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import getPageTitleByBlockUid from "roamjs-components/queries/getPageTitleByBlockUid";

export const track = (
  eventName: string,
  properties?: Dict
): Promise<AxiosResponse> =>
  axios.post(`https://lambda.roamjs.com/mixpanel`, { eventName, properties });

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

export const createPageTitleObserver = ({
  title,
  callback,
  log = false,
}: {
  title: string;
  callback: (d: HTMLDivElement) => void;
  log?: boolean;
}): void => {
  const listener = (e?: HashChangeEvent) => {
    const d = document.getElementsByClassName(
      "roam-article"
    )[0] as HTMLDivElement;
    if (d) {
      const uid = getPageUidByPageTitle(title);
      const attribute = `data-roamjs-${uid}`;
      const url = e?.newURL || window.location.href;
      if ((uid && url === getRoamUrl(uid)) || (log && url === getRoamUrl())) {
        // React's rerender crushes the old article/heading
        setTimeout(() => {
          if (!d.hasAttribute(attribute)) {
            d.setAttribute(attribute, "true");
            callback(
              document.getElementsByClassName(
                "roam-article"
              )[0] as HTMLDivElement
            );
          }
        }, 1);
      } else {
        d.removeAttribute(attribute);
      }
    }
  };
  window.addEventListener("hashchange", listener);
  listener();
};

const POPOVER_WRAPPER_CLASS = "sort-popover-wrapper";

export const createSortIcon = (
  refContainer: HTMLDivElement,
  sortCallbacks: { [key: string]: (refContainer: Element) => () => void }
): HTMLSpanElement => {
  // Icon Button
  const popoverWrapper = document.createElement("span");
  popoverWrapper.className = `bp3-popover-wrapper ${POPOVER_WRAPPER_CLASS}`;

  const popoverTarget = document.createElement("span");
  popoverTarget.className = "bp3-popover-target";
  popoverWrapper.appendChild(popoverTarget);

  const popoverButton = createIconButton("sort");
  popoverTarget.appendChild(popoverButton);

  // Overlay Content
  const popoverOverlay = document.createElement("div");
  popoverOverlay.className = "bp3-overlay bp3-overlay-inline";
  popoverWrapper.appendChild(popoverOverlay);

  const transitionContainer = document.createElement("div");
  transitionContainer.className =
    "bp3-transition-container bp3-popover-enter-done";
  transitionContainer.style.position = "absolute";
  transitionContainer.style.willChange = "transform";
  transitionContainer.style.top = "0";
  transitionContainer.style.left = "0";

  const popover = document.createElement("div");
  popover.className = "bp3-popover";
  popover.style.transformOrigin = "162px top";
  transitionContainer.appendChild(popover);

  const popoverContent = document.createElement("div");
  popoverContent.className = "bp3-popover-content";
  popover.appendChild(popoverContent);

  const menuUl = document.createElement("ul");
  menuUl.className = "bp3-menu";
  popoverContent.appendChild(menuUl);

  let selectedMenuItem: HTMLAnchorElement;
  const createMenuItem = (text: string, sortCallback: () => void) => {
    const liItem = document.createElement("li");
    const aMenuItem = document.createElement("a");
    aMenuItem.className = "bp3-menu-item bp3-popover-dismiss";
    liItem.appendChild(aMenuItem);
    const menuItemText = document.createElement("div");
    menuItemText.className = "bp3-text-overflow-ellipsis bp3-fill";
    menuItemText.innerText = text;
    aMenuItem.appendChild(menuItemText);
    menuUl.appendChild(liItem);
    aMenuItem.onclick = (e) => {
      sortCallback();
      aMenuItem.style.fontWeight = "600";
      if (selectedMenuItem) {
        selectedMenuItem.style.fontWeight = null;
      }
      selectedMenuItem = aMenuItem;
      e.stopImmediatePropagation();
      e.preventDefault();
    };
    aMenuItem.onmousedown = (e) => {
      e.stopImmediatePropagation();
      e.preventDefault();
    };
  };
  Object.keys(sortCallbacks).forEach((k: keyof typeof sortCallbacks) =>
    createMenuItem(`Sort By ${k}`, sortCallbacks[k](refContainer))
  );

  let popoverOpen = false;
  const documentEventListener = (e: MouseEvent) => {
    if (
      (!e.target || !popoverOverlay.contains(e.target as HTMLElement)) &&
      popoverOpen
    ) {
      closePopover();
    }
  };

  const closePopover = () => {
    popoverOverlay.className = "bp3-overlay bp3-overlay-inline";
    popoverOverlay.removeChild(transitionContainer);
    document.removeEventListener("click", documentEventListener);
    popoverOpen = false;
  };

  popoverButton.onmousedown = (e) => {
    e.stopImmediatePropagation();
    e.preventDefault();
  };

  popoverButton.onclick = (e) => {
    if (!popoverOpen) {
      transitionContainer.style.transform = `translate3d(${
        popoverButton.offsetLeft <= 240
          ? popoverButton.offsetLeft
          : popoverButton.offsetLeft - 240
      }px, ${popoverButton.offsetTop + 24}px, 0px)`;
      popoverOverlay.className =
        "bp3-overlay bp3-overlay-open bp3-overlay-inline";
      popoverOverlay.appendChild(transitionContainer);
      e.stopImmediatePropagation();
      e.preventDefault();
      document.addEventListener("click", documentEventListener);
      popoverOpen = true;
    } else {
      closePopover();
    }
  };
  return popoverWrapper;
};

// This API is terrible and should be redesigned
export const createSortIcons = (
  containerClass: string,
  callback: (container: HTMLDivElement) => void,
  sortCallbacks: { [key: string]: (refContainer: Element) => () => void },
  childIndex?: number,
  shouldCreate?: (container: HTMLDivElement) => boolean
): void => {
  const sortButtonContainers = Array.from(
    document.getElementsByClassName(containerClass)
  ) as HTMLDivElement[];
  sortButtonContainers.forEach((sortButtonContainer) => {
    const exists =
      sortButtonContainer.getElementsByClassName(POPOVER_WRAPPER_CLASS).length >
      0;
    if (exists) {
      return;
    }

    if (shouldCreate && !shouldCreate(sortButtonContainer)) {
      return;
    }

    const popoverWrapper = createSortIcon(sortButtonContainer, sortCallbacks);
    if (childIndex) {
      const before = sortButtonContainer.children[childIndex];
      sortButtonContainer.insertBefore(popoverWrapper, before);
    } else {
      sortButtonContainer.appendChild(popoverWrapper);
    }

    callback(sortButtonContainer);
  });
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

const toAttributeValue = (s: string) =>
  (s.trim().startsWith("{{or: ")
    ? s.substring("{{or: ".length, s.indexOf("|"))
    : s
  ).trim();

const getAttrConfigFromQuery = (query: string) => {
  const pageResults = window.roamAlphaAPI.q(query) as {
    attrs: [string, string, { source: string[] }][];
  }[][];
  if (pageResults.length === 0) {
    return {};
  }
  const resultAsBlock = pageResults[0][0];
  if (!resultAsBlock.attrs) {
    return {};
  }
  const configurationAttrRefs = resultAsBlock.attrs.map((a) => a[2].source[1]);
  const entries = configurationAttrRefs.map((r) => {
    let _a, _b, _c;
    return (
      ((_c =
        (_b =
          (_a = window.roamAlphaAPI.q(
            `[:find (pull ?e [:block/string]) :where [?e :block/uid "${r}"] ]`
          )[0]) === null || _a === void 0
            ? void 0
            : _a[0]) === null || _b === void 0
          ? void 0
          : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            _b.string) === null || _c === void 0
        ? void 0
        : _c.split("::").map(toAttributeValue)) || [r, "undefined"]
    );
  });
  return Object.fromEntries(entries);
};

export const getConfigFromBlock = (
  container: HTMLElement
): { [key: string]: string } => {
  const block = container.closest(".roam-block");
  if (!block) {
    return {};
  }
  const blockId = block.id.substring(block.id.length - 9, block.id.length);

  return getAttrConfigFromQuery(
    `[:find (pull ?e [*]) :where [?e :block/uid "${blockId}"]]`
  );
};

export const getWordCount = (str = ""): number =>
  str.trim().split(/\s+/).length;

export const getRefTitlesByBlockUid = (uid: string): string[] =>
  window.roamAlphaAPI
    .q(
      `[:find (pull ?r [:node/title]) :where [?e :block/refs ?r] [?e :block/uid "${uid}"]]`
    )
    .map((b: { title: string }[]) => b[0]?.title || "");

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

export const getPageTitle = (e: Element): ChildNode => {
  const container =
    e.closest(".roam-log-page") ||
    e.closest(".rm-sidebar-outline") ||
    e.closest(".roam-article") ||
    document;
  const heading =
    (container.getElementsByClassName(
      "rm-title-display"
    )[0] as HTMLHeadingElement) ||
    (container.getElementsByClassName(
      "rm-zoom-item-content"
    )[0] as HTMLSpanElement);
  return Array.from(heading.childNodes).find(
    (n) => n.nodeName === "#text" || n.nodeName === "SPAN"
  );
};

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

export const isApple = isIOS || isMacOs;

export const isControl = (e: KeyboardEvent | MouseEvent): boolean =>
  (e.ctrlKey && !isApple) || (e.metaKey && isApple);

export const addStyle = (content: string): HTMLStyleElement => {
  const css = document.createElement("style");
  css.textContent = content;
  document.getElementsByTagName("head")[0].appendChild(css);
  return css;
};

export const getRoamUrl = (blockUid?: string): string =>
  `${window.location.href.replace(/\/page\/.*$/, "")}${
    blockUid ? `/page/${blockUid}` : ""
  }`;

export const getRoamUrlByPage = (page: string): string => {
  const uid = getPageUidByPageTitle(page);
  return uid && getRoamUrl(uid);
};

export const BLOCK_REF_REGEX = new RegExp("\\(\\((..........?)\\)\\)", "g");

export const getTitlesReferencingPagesInSameBlockTree = (
  pages: string[]
): string[] => {
  return window.roamAlphaAPI
    .q(
      `[:find ?title ${pages
        .map((_, i) => `(pull ?b${i} [:block/parents, :db/id])`)
        .join(" ")} :where [?e :node/title ?title] ${pages
        .map(
          (p, i) =>
            `[?b${i} :block/page ?e] [?b${i} :block/refs ?d${i}] [?d${i} :node/title "${p}"]`
        )
        .join(" ")}]`
    )
    .filter((r) => {
      const blocks = r.slice(1) as { parents: { id: number }[]; id: number }[];
      if (new Set(blocks.map((b) => b.id)).size === 1) {
        return true;
      }
      const topMostBlock = blocks
        .slice(1)
        .reduce(
          (prev, cur) =>
            cur.parents.length < prev.parents.length ? cur : prev,
          blocks[0]
        );
      return blocks.every(
        (b) =>
          b === topMostBlock ||
          b.parents.some(({ id }) => id === topMostBlock.id)
      );
    })
    .map((r) => r[0] as string);
};

export const getAttributeValueFromPage = ({
  pageName,
  attributeName,
}: {
  pageName: string;
  attributeName: string;
}): string => {
  const blockString = window.roamAlphaAPI.q(
    `[:find ?s :where [?b :block/string ?s] [?r :node/title "${attributeName}"] [?b :block/refs ?r] [?b :block/page ?p] [?p :node/title "${pageName}"]]`
  )?.[0]?.[0] as string;
  return blockString
    ? blockString.match(new RegExp(`${attributeName}::(.*)`))?.[1] || ""
    : "";
};

export const DAILY_NOTE_PAGE_REGEX =
  /(January|February|March|April|May|June|July|August|September|October|November|December) [0-3]?[0-9](st|nd|rd|th), [0-9][0-9][0-9][0-9]/;
export const DAILY_NOTE_TAG_REGEX = new RegExp(
  `#?\\[\\[(${DAILY_NOTE_PAGE_REGEX.source})\\]\\]`
);
export const DAILY_NOTE_TAG_REGEX_GLOBAL = new RegExp(
  DAILY_NOTE_TAG_REGEX,
  "g"
);
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

export const getDropUidOffset = (
  d: HTMLDivElement
): { parentUid: string; offset: number } => {
  const separator = d.parentElement;
  const childrenContainer = separator.parentElement;
  const index = Array.from(childrenContainer.children).findIndex(
    (c) => c === separator
  );
  const offset = Array.from(childrenContainer.children).reduce(
    (prev, cur, ind) =>
      cur.classList.contains("roam-block-container") && ind < index
        ? prev + 1
        : prev,
    0
  );
  const parentBlock =
    childrenContainer.previousElementSibling.getElementsByClassName(
      "roam-block"
    )?.[0] as HTMLDivElement;
  const parentUid = parentBlock
    ? getUids(parentBlock).blockUid
    : getPageUidByPageTitle(getPageTitle(childrenContainer).textContent);
  return {
    parentUid,
    offset,
  };
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
