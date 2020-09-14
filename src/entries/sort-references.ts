const referenceButtonContainer = document.getElementsByClassName(
  "rm-reference-container dont-focus-block"
)[0] as HTMLDivElement;

// Icon Button
const popoverWrapper = document.createElement("span");
popoverWrapper.className = "bp3-popover-wrapper";
console.log(referenceButtonContainer ? "" : "referenceButtonContainer was null");
referenceButtonContainer.appendChild(popoverWrapper);

const popoverTarget = document.createElement("span");
popoverTarget.className = "bp3-popover-target";
console.log(popoverWrapper ? "" : "popoverWrapper was null");
popoverWrapper.appendChild(popoverTarget);

const popoverButton = document.createElement("span");
popoverButton.className = "bp3-button bp3-minimal bp3-small";
popoverButton.tabIndex = 0;
console.log(popoverTarget ? "" : "popoverTarget was null");
popoverTarget.appendChild(popoverButton);

const popoverIcon = document.createElement("span");
popoverIcon.className = "bp3-icon bp3-icon-sort";
console.log(popoverButton ? "" : "popoverButton was null");
popoverButton.appendChild(popoverIcon);

// Overlay Content
const popoverOverlay = document.createElement("div");
popoverOverlay.className = "bp3-overlay bp3-overlay-inline";
console.log(popoverWrapper ? "" : "popoverWrapper was null");
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
console.log(transitionContainer ? "" : "transitionContainer was null");
transitionContainer.appendChild(popover);

const popoverContent = document.createElement("div");
popoverContent.className = "bp3-popover-content";
console.log(popover ? "" : "popover was null");
popover.appendChild(popoverContent);

const menuUl = document.createElement("ul");
menuUl.className = "bp3-menu";
console.log(popoverContent ? "" : "popoverContent was null");
popoverContent.appendChild(menuUl);

const menuItemCallback = (sortBy: string) => {
  const pageTitle = document.getElementsByClassName(
    "rm-title-display"
  )[0] as HTMLHeadingElement;
  const parentBlocks = window.roamAlphaAPI
    .q(
      `[:find (pull ?parentPage [:node/title]) :where [?parentPage :block/children ?referencingBlock] [?referencingBlock :block/refs ?referencedPage] [?referencedPage :node/title "${pageTitle.innerText}"]]`
    )
    .filter((block) => block.length);
  const linkedReferences = parentBlocks
    .filter((b) => b[0])
    .map((b) => b[0])
    .sort((a, b) => a[sortBy] - b[sortBy]);
  console.log(linkedReferences);
};

const createMenuItem = (text: string, sortBy: string) => {
  const liItem = document.createElement("li");
  const aMenuItem = document.createElement("a");
  aMenuItem.className = "bp3-menu-item bp3-popover-dismiss";
  console.log(liItem ? "" : "liItem was null");
  liItem.appendChild(aMenuItem);
  const menuItemText = document.createElement("div");
  menuItemText.className = "bp3-text-overflow-ellipsis bp3-fill";
  menuItemText.innerText = text;
  console.log(aMenuItem ? "" : "aMenuItem was null");
  aMenuItem.appendChild(menuItemText);
  console.log(menuUl ? "" : "menuUl was null");
  menuUl.appendChild(liItem);
  aMenuItem.onclick = (e) => {
    console.log("onclick")
    menuItemCallback(sortBy);
    e.stopImmediatePropagation();
    e.preventDefault();
  };
};
createMenuItem("Sort By Page Title", "title");
createMenuItem("Sort By Created Date", "time");

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
  popoverOverlay.removeChild(transitionContainer);
  document.removeEventListener("click", documentEventListener);
  popoverOpen = false;
};

popoverButton.onclick = (e) => {
  if (!popoverOpen) {
    const { pageX, pageY } = e;
    transitionContainer.style.transform = `translate3d(${
      pageX - 180
    }px, ${pageY}px, 0px)`;
    console.log(popoverOverlay ? "" : "popoverOverlay was null");
    popoverOverlay.appendChild(transitionContainer);
    e.stopImmediatePropagation();
    e.preventDefault();
    document.addEventListener("click", documentEventListener);
    popoverOpen = true;
  } else {
    closePopover();
  }
};
