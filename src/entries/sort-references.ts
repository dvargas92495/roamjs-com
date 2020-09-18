import parse from "date-fns/parse";
import { getConfigFromPage } from "../entry-helpers";

const POPOVER_WRAPPER_ID = "sort-references-popover-wrapper";

// Icon Button
const popoverWrapper = document.createElement("span");
popoverWrapper.className = "bp3-popover-wrapper";
popoverWrapper.id = POPOVER_WRAPPER_ID;

const popoverTarget = document.createElement("span");
popoverTarget.className = "bp3-popover-target";
popoverWrapper.appendChild(popoverTarget);

const popoverButton = document.createElement("span");
popoverButton.className = "bp3-button bp3-minimal bp3-small";
popoverButton.tabIndex = 0;
popoverTarget.appendChild(popoverButton);

const popoverIcon = document.createElement("span");
popoverIcon.className = "bp3-icon bp3-icon-sort";
popoverButton.appendChild(popoverIcon);

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

type RoamBlock = {
  title: string;
  time: number;
  id: number;
  uid: string;
};

const menuItemCallback = (sortBy: (a: RoamBlock, b: RoamBlock) => number) => {
  const pageTitle = document.getElementsByClassName(
    "rm-title-display"
  )[0] as HTMLHeadingElement;
  if (!pageTitle) {
    return;
  }
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
      `[:find (pull ?parentPage [*]) :where [?parentPage :block/children ?referencingBlock] [?referencingBlock :block/refs ?referencedPage] [?referencedPage :node/title "${pageTitle.innerText}"]]`
    )
    .filter((block) => block.length);
  const linkedReferences = parentBlocks.map((b) =>
    findParentBlock(b[0])
  ) as RoamBlock[];
  linkedReferences.sort(sortBy);
  const refIndexByTitle: { [key: string]: number } = {};
  linkedReferences.forEach((v, i) => (refIndexByTitle[v.title] = i));

  const refContainer = document.getElementsByClassName(
    "rm-mentions refs-by-page-view"
  )[0];
  const refsInView = Array.from(
    document.getElementsByClassName("rm-ref-page-view")
  );
  refsInView.forEach((r) => refContainer.removeChild(r));
  refsInView.sort((a, b) => {
    const aTitle = a.getElementsByClassName(
      "rm-ref-page-view-title"
    )[0] as HTMLDivElement;
    const bTitle = b.getElementsByClassName(
      "rm-ref-page-view-title"
    )[0] as HTMLDivElement;
    return (
      refIndexByTitle[aTitle.textContent] - refIndexByTitle[bTitle.textContent]
    );
  });
  refsInView.forEach((r) => refContainer.appendChild(r));
};

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
    e.stopImmediatePropagation();
    e.preventDefault();
  };
};
const sortCallbacks = {
  "Page Title": () =>
    menuItemCallback((a, b) => a.title.localeCompare(b.title)),
  "Page Title Descending": () =>
    menuItemCallback((a, b) => b.title.localeCompare(a.title)),
  "Created Date": () => menuItemCallback((a, b) => a.time - b.time),
  "Created Date Descending": () => menuItemCallback((a, b) => b.time - a.time),
  "Daily Note": () =>
    menuItemCallback((a, b) => {
      const aDate = parse(a.title, "MMMM do, yyyy", new Date()).valueOf();
      const bDate = parse(b.title, "MMMM do, yyyy", new Date()).valueOf();
      if (isNaN(aDate) && isNaN(bDate)) {
        return a.time - b.time;
      } else if (isNaN(aDate)) {
        return 1;
      } else if (isNaN(bDate)) {
        return -1;
      } else {
        return aDate - bDate;
      }
    }),
    "Daily Note Descending": () =>
      menuItemCallback((a, b) => {
        const aDate = parse(a.title, "MMMM do, yyyy", new Date()).valueOf();
        const bDate = parse(b.title, "MMMM do, yyyy", new Date()).valueOf();
        if (isNaN(aDate) && isNaN(bDate)) {
          return b.time - a.time;
        } else if (isNaN(aDate)) {
          return 1;
        } else if (isNaN(bDate)) {
          return -1;
        } else {
          return bDate - aDate;
        }
      }),
};
Object.keys(sortCallbacks).forEach((k: keyof typeof sortCallbacks) =>
  createMenuItem(`Sort By ${k}`, sortCallbacks[k])
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

popoverButton.onclick = (e) => {
  if (!popoverOpen) {
    const target = e.target as HTMLButtonElement;
    transitionContainer.style.transform = `translate3d(${
      target.offsetLeft - 240
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

const createSortIcon = () => {
  const referenceButtonContainer = document.getElementsByClassName(
    "rm-reference-container dont-focus-block"
  )[0] as HTMLDivElement;
  if (referenceButtonContainer) {
    referenceButtonContainer.appendChild(popoverWrapper);

    const thisPageConfig = getConfigFromPage();
    const thisPageDefaultSort = thisPageConfig[
      "Default Sort"
    ] as keyof typeof sortCallbacks;
    if (thisPageDefaultSort && sortCallbacks[thisPageDefaultSort]) {
      sortCallbacks[thisPageDefaultSort]();
      return;
    }

    const config = getConfigFromPage("sort-references");
    const defaultSort = config["Default Sort"] as keyof typeof sortCallbacks;
    if (defaultSort && sortCallbacks[defaultSort]) {
      sortCallbacks[defaultSort]();
    }
  }
};
createSortIcon();

const mutationConfig = { childList: true, subtree: true };
const mutationTarget = document.getElementsByClassName("roam-body")[0];
const mutationCallback = () => {
  if (!document.getElementById(POPOVER_WRAPPER_ID)) {
    createSortIcon();
  }
};
const observer = new MutationObserver(mutationCallback);
observer.observe(mutationTarget, mutationConfig);
