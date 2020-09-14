const referenceButtonContainer = document.getElementsByClassName(
  "rm-reference-container dont-focus-block"
)[0] as HTMLDivElement;

// Icon Button
const popoverWrapper = document.createElement("span");
popoverWrapper.className = "bp3-popover-wrapper";
referenceButtonContainer.appendChild(popoverWrapper);

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

const createMenuItem = (text: string) => {
  const liItem = document.createElement("li");
  const aMenuItem = document.createElement("a");
  aMenuItem.className = "bp3-menu-item bp3-popover-dismiss";
  liItem.appendChild(aMenuItem);
  const menuItemText = document.createElement("div");
  menuItemText.className = "bp3-text-overflow-ellipsis bp3-fill";
  menuItemText.innerText = text;
  aMenuItem.appendChild(menuItemText);
  menuUl.appendChild(liItem);
};
createMenuItem("Sort By Page Title");
createMenuItem("Sort By Created Date");

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
    popoverOverlay.appendChild(transitionContainer);
    e.stopImmediatePropagation();
    e.preventDefault();
    document.addEventListener("click", documentEventListener);
    popoverOpen = true;
  } else {
    closePopover();
  }
};
