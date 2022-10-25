import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import runExtension from "roamjs-components/util/runExtension";
import getPageTitleValueByHtmlElement from "roamjs-components/dom/getPageTitleValueByHtmlElement";
import getLinkedPageReferences from "roamjs-components/queries/getPageTitleReferencesByPageTitle";
import createObserver from "roamjs-components/dom/createObserver";
import createIconButton from "roamjs-components/dom/createIconButton";

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
const createSortIcons = (
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

runExtension({
  extensionId: "sort-references",
  migratedTo: "Query Builder",
  run: () => {
    const config = Object.fromEntries(
      getFullTreeByParentUid(getPageUidByPageTitle("roam/js/sort-references"))
        .children.map((c) => c.text.split("::"))
        .filter((c) => c.length === 2)
    );
    const getAttribute = (attr: string) => {
      const page =
        document.getElementsByClassName("rm-title-display")[0]?.textContent;
      const node =
        getFullTreeByParentUid(getPageUidByPageTitle(page)).children.find((t) =>
          new RegExp(`${attr}::`, "i").test(t.text)
        )?.text || "";
      return node.substring(attr.length + 2).trim();
    };

    const menuItemCallback = (
      sortContainer: Element,
      sortBy: (
        a: { title: string; time: number },
        b: { title: string; time: number }
      ) => number
    ) => {
      const pageTitle = getPageTitleValueByHtmlElement(sortContainer);
      if (!pageTitle) {
        return;
      }
      const linkedReferences = getLinkedPageReferences(pageTitle).map(
        (title) => ({
          title,
          time:
            window.roamAlphaAPI.pull("[:create/time]", [
              ":node/title",
              title,
            ])?.[":create/time"] || 0,
        })
      );
      linkedReferences.sort(sortBy);
      const refIndexByTitle: { [key: string]: number } = {};
      linkedReferences.forEach((v, i) => (refIndexByTitle[v.title] = i));
      const getRefIndexByTitle = (title: string) => {
        if (!isNaN(refIndexByTitle[title])) {
          return refIndexByTitle[title];
        }
        const len = Object.keys(refIndexByTitle).length;
        refIndexByTitle[title] = len;
        return len;
      };

      const refContainer = sortContainer.parentElement
        .closest(".rm-reference-container")
        ?.getElementsByClassName("refs-by-page-view")?.[0];
      const refsInView = Array.from(refContainer.children);
      refsInView.forEach((r) => refContainer.removeChild(r));
      refsInView.sort((a, b) => {
        const aTitle = a.getElementsByClassName(
          "rm-ref-page-view-title"
        )?.[0] as HTMLDivElement;
        const bTitle = b.getElementsByClassName(
          "rm-ref-page-view-title"
        )?.[0] as HTMLDivElement;
        return (
          getRefIndexByTitle(aTitle?.textContent || "") -
          getRefIndexByTitle(bTitle?.textContent || "")
        );
      });
      refsInView.forEach((r) => refContainer.appendChild(r));
    };

    const sortCallbacks = {
      "Page Title": (refContainer: Element) => () =>
        menuItemCallback(refContainer, (a, b) =>
          a.title.localeCompare(b.title)
        ),
      "Page Title Descending": (refContainer: Element) => () =>
        menuItemCallback(refContainer, (a, b) =>
          b.title.localeCompare(a.title)
        ),
      "Created Date": (refContainer: Element) => () =>
        menuItemCallback(refContainer, (a, b) => a.time - b.time),
      "Created Date Descending": (refContainer: Element) => () =>
        menuItemCallback(refContainer, (a, b) => b.time - a.time),
      "Daily Note": (refContainer: Element) => {
        const dailyNoteSecondary =
          getAttribute("Daily Note Secondary") ||
          config["Daily Note Secondary"] ||
          "time";
        return () =>
          menuItemCallback(refContainer, (a, b) => {
            const aDate = window.roamAlphaAPI.util.pageTitleToDate(a.title);
            const bDate = window.roamAlphaAPI.util.pageTitleToDate(b.title);
            if (!aDate && !bDate) {
              if (/^page title$/i.test(dailyNoteSecondary)) {
                return a.title.localeCompare(b.title);
              } else if (/^page title descending$/i.test(dailyNoteSecondary)) {
                return b.title.localeCompare(a.title);
              } else {
                return a.time - b.time;
              }
            } else if (!aDate) {
              return 1;
            } else if (!bDate) {
              return -1;
            } else {
              return aDate.valueOf() - bDate.valueOf();
            }
          });
      },
      "Daily Note Descending": (refContainer: Element) => {
        const dailyNoteSecondary =
          getAttribute("Daily Note Secondary") ||
          config["Daily Note Secondary"] ||
          "time";
        return () =>
          menuItemCallback(refContainer, (a, b) => {
            const aDate = window.roamAlphaAPI.util.pageTitleToDate(a.title);
            const bDate = window.roamAlphaAPI.util.pageTitleToDate(b.title);
            if (!aDate && !bDate) {
              if (/^page title$/i.test(dailyNoteSecondary)) {
                return a.title.localeCompare(b.title);
              } else if (/^page title descending$/i.test(dailyNoteSecondary)) {
                return b.title.localeCompare(a.title);
              } else {
                return b.time - a.time;
              }
            } else if (!aDate) {
              return 1;
            } else if (!bDate) {
              return -1;
            } else {
              return bDate.valueOf() - aDate.valueOf();
            }
          });
      },
    };

    const createSortIconCallback = (container: HTMLDivElement) => {
      const thisPageDefaultSort = getAttribute(
        "Default Sort"
      ) as keyof typeof sortCallbacks;
      if (thisPageDefaultSort && sortCallbacks[thisPageDefaultSort]) {
        sortCallbacks[thisPageDefaultSort](container)();
        return;
      }

      const defaultSort = config["Default Sort"] as keyof typeof sortCallbacks;
      if (defaultSort && sortCallbacks[defaultSort]) {
        sortCallbacks[defaultSort](container)();
      }
    };
    const observerCallback = () =>
      createSortIcons(
        "rm-reference-container dont-focus-block",
        createSortIconCallback,
        sortCallbacks,
        undefined,
        (container: HTMLDivElement) =>
          !!container.parentElement
            .closest(".rm-reference-container")
            ?.getElementsByClassName("refs-by-page-view")?.[0]
      );
    createObserver(observerCallback);
  },
});
