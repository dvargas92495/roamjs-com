const referenceButtonContainer = document.getElementsByClassName(
  "rm-reference-container dont-focus-block"
)[0] as HTMLDivElement;

const popoverWrapper = document.createElement("span");
popoverWrapper.className = "bp3-popover-wrapper";
referenceButtonContainer.appendChild(popoverWrapper);

const popoverTarget = document.createElement("span");
popoverTarget.className = "bp3-popover-target";
popoverWrapper.appendChild(popoverTarget);

const popoverOverlay = document.createElement("div");
popoverOverlay.className = "bp3-overlay bp3-overlay-inline";
popoverWrapper.appendChild(popoverOverlay);

const popoverButton = document.createElement("span");
popoverButton.className = "bp3-button bp3-minimal bp3-small";
popoverButton.tabIndex = 0;
popoverTarget.appendChild(popoverButton);

const popoverIcon = document.createElement("span");
popoverIcon.className = "bp3-icon bp3-icon-sort";
popoverTarget.appendChild(popoverIcon);
