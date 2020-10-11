import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/dom";
import { getAttrConfigFromQuery } from "roam-client";

const waitForString = (text: string) =>
  waitFor(
    () => {
      const textArea = document.activeElement as HTMLTextAreaElement;
      if (textArea?.value == null) {
        throw new Error(
          `Textarea is undefined. Active Element ${textArea.tagName}. Input text ${text}`
        );
      }

      let expectedTextWithoutPeriod = text.replace(/\./g, "").toUpperCase();
      let actualTextWithoutPeriod = textArea.value
        .replace(/\./g, "")
        .toUpperCase();

      // relaxing constraint for equality because there is an issue with periods.
      // in some cases, userEvent.type doesn't type the periods.
      if (actualTextWithoutPeriod !== expectedTextWithoutPeriod) {
        throw new Error("Typing not complete");
      }
    },
    {
      timeout: 5000,
    }
  );

export const getUids = (block: Element) => {
  const blockUid = block.id.substring(block.id.length - 9, block.id.length);
  const restOfHTMLId = block.id.substring(0, block.id.length - 9);
  const potentialDateUid = restOfHTMLId.substring(
    restOfHTMLId.length - 11,
    restOfHTMLId.length - 1
  );
  const parentUid = isNaN(new Date(potentialDateUid).valueOf())
    ? potentialDateUid.substring(1)
    : potentialDateUid;
  return {
    blockUid,
    parentUid,
  };
};

const clickEventListener = (
  targetCommand: string,
  callback: (
    buttonConfig?: { [key: string]: string },
    blockUid?: string,
    parentUid?: string
  ) => void
) => async (e: MouseEvent) => {
  const htmlTarget = e.target as HTMLElement;
  if (
    htmlTarget &&
    htmlTarget.tagName === "BUTTON" &&
    htmlTarget.innerText
      .toUpperCase()
      .trim()
      .startsWith(targetCommand.toUpperCase())
  ) {
    const target = htmlTarget as HTMLButtonElement;
    const rawParts = target.innerText
      .substring(targetCommand.length + 1)
      .split(" ");
    let quotedWord = "";
    const restOfButtonText: string[] = [];
    for (var i = 0; i < rawParts.length; i++) {
      if (quotedWord) {
        if (rawParts[i].endsWith('"')) {
          restOfButtonText.push(
            `${quotedWord} ${rawParts[i].substring(0, rawParts[i].length - 1)}`
          );
          quotedWord = "";
        } else {
          quotedWord = `${quotedWord} ${rawParts[i]}`;
        }
      } else {
        if (rawParts[i].startsWith('"')) {
          quotedWord = rawParts[i].substring(1);
        } else {
          restOfButtonText.push(rawParts[i]);
        }
      }
    }

    const numPairs = Math.floor(restOfButtonText.length / 2);
    const buttonConfig = {} as { [key: string]: string };
    for (var i = 0; i < numPairs; i++) {
      buttonConfig[restOfButtonText[i * 2]] = restOfButtonText[i * 2 + 1];
    }

    if (window.roamDatomicAlphaAPI) {
      target.innerText = "Loading...";
      target.disabled = true;

      const block = target.closest(".roam-block");
      const { blockUid, parentUid } = getUids(block);
      window
        .roamDatomicAlphaAPI({
          action: "update-block",
          block: {
            uid: blockUid,
            string: "",
          },
        })
        .then(() => callback(buttonConfig, blockUid, parentUid));
    } else {
      const divContainer = target.parentElement.parentElement
        .parentElement as HTMLDivElement;
      await userEvent.click(divContainer);
      await waitForString(`{{${target.innerText}}}`);
      const textArea = document.activeElement as HTMLTextAreaElement;
      await userEvent.clear(textArea);
      await waitForString("");
      callback(buttonConfig);
    }
  }
};

export const addButtonListener = (
  targetCommand: string,
  callback: (
    buttonConfig?: { [key: string]: string },
    blockUid?: string,
    parentUid?: string
  ) => void
) =>
  document.addEventListener(
    "click",
    clickEventListener(targetCommand, callback)
  );

export const createObserver = (
  mutationCallback: (mutationList?: MutationRecord[]) => void
) =>
  createDivObserver(
    mutationCallback,
    document.getElementsByClassName("roam-body")[0]
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

/**
 * @param icon A blueprint icon which coul be found in https://blueprintjs.com/docs/#icons
 */
export const createIconButton = (icon: string) => {
  const popoverButton = document.createElement("span");
  popoverButton.className = "bp3-button bp3-minimal bp3-small";
  popoverButton.tabIndex = 0;

  const popoverIcon = document.createElement("span");
  popoverIcon.className = `bp3-icon bp3-icon-${icon}`;
  popoverButton.appendChild(popoverIcon);

  return popoverButton;
};

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
    `[:find (pull ?e [:create/time]) :where [?e :node/title "${title}"]]`
  )[0][0]?.time;
  return result || getEditTimeByTitle(title);
};

export const getEditTimeByTitle = (title: string) =>
  window.roamAlphaAPI.q(
    `[:find (pull ?e [:edit/time]) :where [?e :node/title "${title}"]]`
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
