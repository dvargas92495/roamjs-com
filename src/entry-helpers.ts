import {
  asyncType,
  createIconButton,
  getAttrConfigFromQuery,
  getUids,
} from "roam-client";
import { isIOS, isMacOs } from "mobile-device-detect";
import mixpanel from "mixpanel-browser";

declare global {
  interface Window {
    depot: {
      roamjs: {
        alerted: boolean;
      };
    };
    roam42?: {
      smartBlocks: {
        customCommands: {
          key: string; // `<% ${string} %> (SmartBlock function)`, sad - https://github.com/microsoft/TypeScript/issues/13969
          icon: "gear";
          value: () => Promise<void>;
          processor: "function";
        }[];
      };
    };
  }
}

const roamJsVersion = process.env.ROAMJS_VERSION || "0";
mixpanel.init(process.env.MIXPANEL_TOKEN);

export const runExtension = (extensionId: string, run: () => void) => {
  if (process.env.IS_LEGACY && !window.depot?.roamjs?.alerted) {
    if (!window.depot) {
      window.depot = { roamjs: { alerted: true } };
    } else if (!window.depot.roamjs) {
      window.depot.roamjs = { alerted: true };
    } else {
      window.depot.roamjs.alerted = true;
    }
    window.alert(
      'Hey! Thanks for using extensions from roam.davidvargas.me! I\'m currently migrating the extensions to roamjs.com. Please edit the src in your roam/js block, replacing "roam.davidvargas.me/master" with "roamjs.com"'
    );
    mixpanel.track("Legacy Alerted");
  }

  mixpanel.track("Load Extension", {
    extensionId,
    roamJsVersion,
  });
  run();
};

export const replaceText = async ([before, after]: string[]) => {
  const textArea = document.activeElement as HTMLTextAreaElement;
  const index = before ? textArea.value.indexOf(before) : textArea.value.length;
  if (index >= 0) {
    textArea.setSelectionRange(index, index + before.length);
    await asyncType(`${before ? "{backspace}" : ""}${after}`);
  }
};

export const replaceTagText = async ({
  before,
  after,
  addHash = false,
}: {
  before: string;
  after: string;
  addHash?: boolean;
}) => {
  if (before) {
    await replaceText([`#[[${before}]]`, after ? `#[[${after}]]` : ""]);
    await replaceText([`[[${before}]]`, after ? `[[${after}]]` : ""]);
    const hashAfter = after.includes(" ") ? `#[[${after}]]` : `#${after}`;
    await replaceText([`#${before}`, after ? `#${hashAfter}` : ""]);
  } else {
    await replaceText(["", `${addHash ? "#" : ""}[[${after}]]`]);
  }
};

export const createObserver = (
  mutationCallback: (mutationList?: MutationRecord[]) => void
) =>
  createDivObserver(
    mutationCallback,
    document.getElementsByClassName("roam-body")[0]
  );

const getMutatedNodes = ({
  ms,
  tag,
  className,
  nodeList,
}: {
  ms: MutationRecord[];
  tag: string;
  className: string;
  nodeList: "addedNodes" | "removedNodes";
}) => {
  const blocks = ms.flatMap((m) =>
    Array.from(m[nodeList]).filter(
      (d: Node) =>
        d.nodeName === tag &&
        Array.from((d as HTMLElement).classList).includes(className)
    )
  );
  const childBlocks = ms.flatMap((m) =>
    Array.from(m[nodeList])
      .filter((n) => n.hasChildNodes())
      .flatMap((d) =>
        Array.from((d as HTMLElement).getElementsByClassName(className))
      )
  );
  return [...blocks, ...childBlocks];
};

export const createHTMLObserver = (
  callback: (b: HTMLElement) => void,
  tag: string,
  className: string
) => {
  const blocks = document.getElementsByClassName(className);
  Array.from(blocks).forEach(callback);

  createObserver((ms) => {
    const addedNodes = getMutatedNodes({
      ms,
      nodeList: "addedNodes",
      tag,
      className,
    });
    addedNodes.forEach(callback);
  });
};

export const createBlockObserver = (
  blockCallback: (b: HTMLDivElement) => void,
  blockRefCallback: (b: HTMLSpanElement) => void
) => {
  createHTMLObserver(blockCallback, "DIV", "roam-block");
  createHTMLObserver(blockRefCallback, "SPAN", "rm-block-ref");
};

export const createPageObserver = (
  name: string,
  callback: (blockUid: string, added: boolean) => void
) =>
  createObserver((ms) => {
    const addedNodes = getMutatedNodes({
      ms,
      nodeList: "addedNodes",
      tag: "DIV",
      className: "roam-block",
    }).map((blockNode) => ({
      blockUid: getUids(blockNode as HTMLDivElement).blockUid,
      added: true,
    }));

    const removedNodes = getMutatedNodes({
      ms,
      nodeList: "removedNodes",
      tag: "DIV",
      className: "roam-block",
    }).map((blockNode) => ({
      blockUid: getUids(blockNode as HTMLDivElement).blockUid,
      added: false,
    }));

    if (addedNodes.length || removedNodes.length) {
      const blockUids = getBlockUidsByPageTitle(name);
      [...removedNodes, ...addedNodes]
        .filter(({ blockUid }) => blockUids.has(blockUid))
        .forEach(({ blockUid, added }) => callback(blockUid, added));
    }
  });

export const createButtonObserver = ({
  shortcut,
  attribute,
  render,
}: {
  shortcut: string;
  attribute: string;
  render: (b: HTMLButtonElement) => void;
}) =>
  createHTMLObserver(
    (b) => {
      if (
        b.innerText.toUpperCase() ===
          attribute.toUpperCase().replace("-", " ") ||
        b.innerText.toUpperCase() === shortcut.toUpperCase()
      ) {
        const dataAttribute = `data-roamjs-${attribute}`;
        if (!b.getAttribute(dataAttribute)) {
          b.setAttribute(dataAttribute, "true");
          render(b as HTMLButtonElement);
        }
      }
    },
    "BUTTON",
    "bp3-button"
  );

export const createOverlayObserver = (
  mutationCallback: (mutationList?: MutationRecord[]) => void
) => createDivObserver(mutationCallback, document.body);

const createDivObserver = (
  mutationCallback: (mutationList?: MutationRecord[]) => void,
  mutationTarget: Element
) => {
  const observer = new MutationObserver(mutationCallback);
  observer.observe(mutationTarget, { childList: true, subtree: true });
};

const POPOVER_WRAPPER_CLASS = "sort-popover-wrapper";

export const createSortIcon = (
  refContainer: HTMLDivElement,
  sortCallbacks: { [key: string]: (refContainer: Element) => () => void }
) => {
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
      const target = e.target as HTMLButtonElement;
      transitionContainer.style.transform = `translate3d(${
        target.offsetLeft <= 240 ? target.offsetLeft : target.offsetLeft - 240
      }px, ${target.offsetTop + 24}px, 0px)`;
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
) => {
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

export const getCreatedTimeByTitle = (title: string) => {
  const result = window.roamAlphaAPI.q(
    `[:find (pull ?e [:create/time]) :where [?e :node/title "${title.replace(
      /"/g,
      '\\"'
    )}"]]`
  )[0][0]?.time;
  return result || getEditTimeByTitle(title);
};

export const getEditTimeByTitle = (title: string) =>
  window.roamAlphaAPI.q(
    `[:find (pull ?e [:edit/time]) :where [?e :node/title "${title.replace(
      /"/g,
      '\\"'
    )}"]]`
  )[0][0]?.time;

export const getConfigFromBlock = (container: HTMLElement) => {
  const block = container.closest(".roam-block");
  if (!block) {
    return {};
  }
  const blockId = block.id.substring(block.id.length - 9, block.id.length);

  return getAttrConfigFromQuery(
    `[:find (pull ?e [*]) :where [?e :block/uid "${blockId}"]]`
  );
};

const getWordCount = (str = "") => str.trim().split(/\s+/).length;

const getWordCountByBlockId = (blockId: number): number => {
  const block = window.roamAlphaAPI.pull(
    "[:block/children, :block/string]",
    blockId
  );
  const children = block[":block/children"] || [];
  const count = getWordCount(block[":block/string"]);
  return (
    count +
    children
      .map((c) => getWordCountByBlockId(c[":db/id"]))
      .reduce((total, cur) => cur + total, 0)
  );
};

export const getWordCountByBlockUid = (blockUid: string) => {
  const block = window.roamAlphaAPI.q(
    `[:find (pull ?e [:block/children, :block/string]) :where [?e :block/uid "${blockUid}"]]`
  )[0][0];
  const children = block.children || [];
  const count = getWordCount(block.string);
  return (
    count +
    children
      .map((c) => getWordCountByBlockId(c.id))
      .reduce((total, cur) => cur + total, 0)
  );
};

export type TreeNode = {
  text: string;
  order: number;
  children: TreeNode[];
  uid: string;
};

const getTextTreeByBlockId = (blockId: number): TreeNode => {
  const block = window.roamAlphaAPI.pull(
    "[:block/children, :block/string, :block/order, :block/uid]",
    blockId
  );
  const children = block[":block/children"] || [];
  return {
    text: block[":block/string"],
    order: block[":block/order"],
    uid: block[":block/uid"],
    children: children
      .map((c) => getTextTreeByBlockId(c[":db/id"]))
      .sort((a, b) => a.order - b.order),
  };
};

export const getTextTreeByBlockUid = (blockUid: string) => {
  const block = window.roamAlphaAPI.q(
    `[:find (pull ?e [:block/children, :block/string]) :where [?e :block/uid "${blockUid}"]]`
  )[0][0];
  const children = block.children || [];
  return {
    text: block.string,
    children: children
      .map((c) => getTextTreeByBlockId(c.id))
      .sort((a, b) => a.order - b.order),
  };
};

export const getTextTreeByPageName = (name: string) => {
  const result = window.roamAlphaAPI.q(
    `[:find (pull ?e [:block/children]) :where [?e :node/title "${name}"]]`
  );
  if (!result.length) {
    return [];
  }
  const block = result[0][0];
  const children = block.children || [];
  return children
    .map((c) => getTextTreeByBlockId(c.id))
    .sort((a, b) => a.order - b.order);
};

export const getWordCountByPageTitle = (title: string) => {
  const page = window.roamAlphaAPI.q(
    `[:find (pull ?e [:block/children]) :where [?e :node/title "${title}"]]`
  )[0][0];
  const children = page.children || [];
  return children
    .map((c) => getWordCountByBlockId(c.id))
    .reduce((total, cur) => cur + total, 0);
};

export const getTextByBlockUid = (uid: string) => {
  const results = window.roamAlphaAPI.q(
    `[:find (pull ?e [:block/string]) :where [?e :block/uid "${uid}"]]`
  );
  if (results.length) {
    return results[0][0]?.string;
  }
  return "";
};

export const getRefTitlesByBlockUid = (uid: string) =>
  window.roamAlphaAPI
    .q(
      `[:find (pull ?r [:node/title]) :where [?e :block/refs ?r] [?e :block/uid "${uid}"]]`
    )
    .map((b) => b[0]?.title || "");

export const getCreateTimeByBlockUid = (uid: string) =>
  window.roamAlphaAPI.q(
    `[:find (pull ?e [:create/time]) :where [?e :block/uid "${uid}"]]`
  )[0][0]?.time;

export const getEditTimeByBlockUid = (uid: string) =>
  window.roamAlphaAPI.q(
    `[:find (pull ?e [:edit/time]) :where [?e :block/uid "${uid}"]]`
  )[0][0]?.time;

export const getPageTitle = (e: Element) => {
  const container =
    e.closest(".roam-log-page") || e.closest(".rm-sidebar-outline") || document;
  const heading = container.getElementsByClassName(
    "rm-title-display"
  )[0] as HTMLHeadingElement;
  return Array.from(heading.childNodes).find(
    (n) => n.nodeName === "#text" || n.nodeName === "SPAN"
  );
};

export const getPageTitleByBlockUid = (blockUid: string): string => {
  const result = window.roamAlphaAPI.q(
    `[:find (pull ?c [:node/title, :block/uid]) :where [?c :block/children ?e] [?e :block/uid "${blockUid}"]]`
  );
  if (!result.length) {
    return "";
  }
  const block = result[0][0];
  return block.title ? block.title : getPageTitleByBlockUid(block.uid);
};

export const getBlockDepthByBlockUid = (blockUid: string): number => {
  const result = window.roamAlphaAPI.q(
    `[:find (pull ?c [:node/title, :block/uid]) :where [?c :block/children ?e] [?e :block/uid "${blockUid}"]]`
  );
  if (!result.length) {
    return -1;
  }
  const block = result[0][0];
  return block.title ? 1 : getBlockDepthByBlockUid(block.uid) + 1;
};

export const getParentUidByBlockUid = (blockUid: string): string => {
  const result = window.roamAlphaAPI.q(
    `[:find (pull ?c [:block/uid]) :where [?c :block/children ?e] [?e :block/uid "${blockUid}"]]`
  );
  return result.length ? result[0][0].uid : "";
};

const getBlockUidsByBlockId = (blockId: number): string[] => {
  const block = window.roamAlphaAPI.pull(
    "[:block/children, :block/uid]",
    blockId
  );
  const children = block[":block/children"] || [];
  return [
    block[":block/uid"],
    ...children.flatMap((c) => getBlockUidsByBlockId(c[":db/id"])),
  ];
};

const getBlockUidsByPageTitle = (title: string) => {
  const result = window.roamAlphaAPI.q(
    `[:find (pull ?e [:block/children]) :where [?e :node/title "${title}"]]`
  );
  if (!result.length) {
    return new Set();
  }
  const page = result[0][0];
  const children = page.children || [];
  return new Set(children.flatMap((c) => getBlockUidsByBlockId(c.id)));
};

export type RoamBlock = {
  title?: string;
  time?: number;
  id?: number;
  uid?: string;
};

export const getLinkedPageReferences = (t: string) => {
  const findParentBlock: (b: RoamBlock) => RoamBlock = (b: RoamBlock) =>
    b.title
      ? b
      : findParentBlock(
          window.roamAlphaAPI.q(
            `[:find (pull ?e [*]) :where [?e :block/children ${b.id}]]`
          )[0][0] as RoamBlock
        );
  const parentBlocks = window.roamAlphaAPI
    .q(
      `[:find (pull ?parentPage [*]) :where [?parentPage :block/children ?referencingBlock] [?referencingBlock :block/refs ?referencedPage] [?referencedPage :node/title "${t.replace(
        /"/g,
        '\\"'
      )}"]]`
    )
    .filter((block) => block.length);
  return parentBlocks.map((b) => findParentBlock(b[0])) as RoamBlock[];
};

export const getChildRefStringsByBlockUid = (b: string) =>
  window.roamAlphaAPI
    .q(
      `[:find (pull ?r [:block/string]) :where [?e :block/refs ?r] [?e :block/uid "${b}"]]`
    )
    .map((r) => r[0].string);

export const getChildRefUidsByBlockUid = (b: string) =>
  window.roamAlphaAPI
    .q(
      `[:find (pull ?r [:block/uid]) :where [?e :block/refs ?r] [?e :block/uid "${b}"]]`
    )
    .map((r) => r[0].uid);

export const getLinkedReferences = (t: string) => {
  const parentBlocks = window.roamAlphaAPI
    .q(
      `[:find (pull ?referencingBlock [*]) :where [?referencingBlock :block/refs ?referencedPage] [?referencedPage :node/title "${t.replace(
        /"/g,
        '\\"'
      )}"]]`
    )
    .filter((block) => block.length);
  return parentBlocks.map((b) => b[0]) as RoamBlock[];
};

export const createMobileIcon = (id: string, iconType: string) => {
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

export const isControl = (e: KeyboardEvent) =>
  (e.ctrlKey && !isApple) || (e.metaKey && isApple);

export const addStyle = (content: string) => {
  const css = document.createElement("style");
  css.textContent = content;
  document.getElementsByTagName("head")[0].appendChild(css);
};

export const createCustomSmartBlockCommand = ({
  command,
  value,
}: {
  command: string;
  value: () => Promise<void>;
}) => {
  const inputListener = () => {
    if (window.roam42) {
      window.roam42.smartBlocks.customCommands.push({
        key: `<% ${command.toUpperCase()} %> (SmartBlock function)`,
        icon: "gear",
        processor: "function",
        value,
      });
      document.removeEventListener("input", inputListener);
    }
  };
  document.addEventListener("input", inputListener);
};
