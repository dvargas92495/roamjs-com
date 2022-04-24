import parse from "date-fns/parse";
import { createSortIcons, runExtension } from "../entry-helpers";
import {
  createObserver,
  getConfigFromPage,
  getLinkedPageReferences,
  getTreeByPageName,
  getPageTitleValueByHtmlElement,
} from "roam-client";

runExtension("sort-references", () => {
  const config = getConfigFromPage("roam/js/sort-references");
  const getAttribute = (attr: string) => {
    const page =
      document.getElementsByClassName("rm-title-display")[0]?.textContent;
    const node =
      getTreeByPageName(page).find((t) =>
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
    const linkedReferences = getLinkedPageReferences(pageTitle).concat(
      window.roamAlphaAPI
        .q(
          `[:find ?t ?ct :where [?c :create/time ?ct] [?c :node/title ?t] [?c :block/refs ?r] [?r :node/title "${pageTitle}"]]`
        )
        .map((p) => ({ title: (p?.[0] as string) || "", time: p[1] as number }))
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
      menuItemCallback(refContainer, (a, b) => a.title.localeCompare(b.title)),
    "Page Title Descending": (refContainer: Element) => () =>
      menuItemCallback(refContainer, (a, b) => b.title.localeCompare(a.title)),
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
          const aDate = parse(a.title, "MMMM do, yyyy", new Date()).valueOf();
          const bDate = parse(b.title, "MMMM do, yyyy", new Date()).valueOf();
          if (isNaN(aDate) && isNaN(bDate)) {
            if (/^page title$/i.test(dailyNoteSecondary)) {
              return a.title.localeCompare(b.title);
            } else if (/^page title descending$/i.test(dailyNoteSecondary)) {
              return b.title.localeCompare(a.title);
            } else {
              return a.time - b.time;
            }
          } else if (isNaN(aDate)) {
            return 1;
          } else if (isNaN(bDate)) {
            return -1;
          } else {
            return aDate - bDate;
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
          const aDate = parse(a.title, "MMMM do, yyyy", new Date()).valueOf();
          const bDate = parse(b.title, "MMMM do, yyyy", new Date()).valueOf();
          if (isNaN(aDate) && isNaN(bDate)) {
            if (/^page title$/i.test(dailyNoteSecondary)) {
              return a.title.localeCompare(b.title);
            } else if (/^page title descending$/i.test(dailyNoteSecondary)) {
              return b.title.localeCompare(a.title);
            } else {
              return b.time - a.time;
            }
          } else if (isNaN(aDate)) {
            return 1;
          } else if (isNaN(bDate)) {
            return -1;
          } else {
            return bDate - aDate;
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
});
