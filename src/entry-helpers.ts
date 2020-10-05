import userEvent from "@testing-library/user-event";
import { waitFor, fireEvent, wait } from "@testing-library/dom";
import { AxiosError } from "axios";

window.fireEvent = fireEvent;

declare global {
  interface Window {
    fireEvent: typeof fireEvent;
    roamAlphaAPI: {
      q: (query: string) => any[];
    };
    roamDatomicAlphaAPI: (params: {
      action: "pull" | "q" | "create-block" | "update-block";
      selector?: string;
      uid?: string;
      query?: string;
      inputs?: any;
      location?: {
        "parent-uid": string;
        order: number;
      };
      block?: {
        string: string;
        uid?: string;
        open?: boolean;
      };
    }) => Promise<{
      children?: { id: number }[];
      id?: number;
      string?: string;
    }>;
  }
}

type RoamError = {
  raw: string;
  "status-code": number;
};

export const asyncType = async (text: string) =>
  await userEvent.type(document.activeElement, text, {
    skipClick: true,
  });

export const genericError = (e: AxiosError & RoamError) => {
  const message =
    (e.response ? JSON.stringify(e.response.data) : e.message) || e.raw || "";
  if (message) {
    asyncType(
      `Error: ${
        message.length > 50 ? `${message.substring(0, 50)}...` : message
      }`
    );
  } else {
    console.error(e);
  }
};

export const waitForString = (text: string) =>
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

export const getConfigFromPage = (inputPage?: string) => {
  const page =
    inputPage ||
    document.getElementsByClassName("rm-title-display")[0]?.textContent;
  if (!page) {
    return {};
  }
  return getAttrConfigFromQuery(
    `[:find (pull ?e [*]) :where [?e :node/title "${page}"] ]`
  );
};

export const getAttrConfigFromQuery = (query: string) => {
  const pageResults = window.roamAlphaAPI.q(query);
  if (pageResults.length === 0 || !pageResults[0][0].attrs) {
    return {};
  }

  const configurationAttrRefs = pageResults[0][0].attrs.map(
    (a: any) => a[2].source[1]
  );
  const entries = configurationAttrRefs.map((r: string) =>
    window.roamAlphaAPI
      .q(
        `[:find (pull ?e [:block/string]) :where [?e :block/uid "${r}"] ]`
      )[0][0]
      .string.split("::")
      .map((s: string) => s.trim())
  );
  return Object.fromEntries(entries);
};

export const pushBullets = async (
  bullets: string[],
  blockUid?: string,
  parentUid?: string
) => {
  if (window.roamDatomicAlphaAPI) {
    const parent = await window.roamDatomicAlphaAPI({
      action: "pull",
      selector: "[:block/children]",
      uid: parentUid,
    });
    const block = await window.roamDatomicAlphaAPI({
      action: "pull",
      selector: "[:db/id]",
      uid: blockUid,
    });
    const blockIndex = parent.children?.findIndex((c) => c.id === block.id);
    for (const index in bullets) {
      const bullet = bullets[index];
      if (index === "0") {
        await window.roamDatomicAlphaAPI({
          action: "update-block",
          block: {
            uid: blockUid,
            string: bullet,
          },
        });
      } else {
        await window.roamDatomicAlphaAPI({
          action: "create-block",
          block: {
            string: bullet,
          },
          location: {
            "parent-uid": parentUid,
            order: blockIndex + parseInt(index) + 1,
          },
        });
      }
    }
  } else {
    for (const index in bullets) {
      const bullet = bullets[index];
      await asyncType(bullet);
      await waitForString(bullet);

      await newBlockEnter();
    }
  }
};

export const newBlockEnter = async () => {
  // Need to switch to fireEvent because user-event enters a newline when hitting enter in a text area
  // https://github.com/testing-library/user-event/blob/master/src/type.js#L505
  const enterObj = {
    key: "Enter",
    keyCode: 13,
    which: 13,
  };
  await fireEvent.keyDown(document.activeElement, enterObj);
  await fireEvent.keyUp(document.activeElement, enterObj);
  await waitForString("");
};

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
) => {
  const listener = clickEventListener(targetCommand, callback);
  document.addEventListener("click", listener);
};

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
  const mutationConfig = { childList: true, subtree: true };
  const observer = new MutationObserver(mutationCallback);
  observer.observe(mutationTarget, mutationConfig);
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
  containerClass: string | (() => HTMLDivElement[]),
  callback: (container: HTMLDivElement) => void,
  sortCallbacks: { [key: string]: (refContainer: Element) => () => void },
  childIndex?: number,
  shouldCreate?: (container: HTMLDivElement) => boolean
) => {
  const sortButtonContainers =
    typeof containerClass === "string"
      ? (Array.from(
          document.getElementsByClassName(containerClass)
        ) as HTMLDivElement[])
      : containerClass();
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
