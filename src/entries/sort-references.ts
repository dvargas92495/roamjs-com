import parse from "date-fns/parse";
import {
  createObserver,
  createSortIcons,
  getPageTitle,
  runExtension,
} from "../entry-helpers";
import {
  getConfigFromPage,
  RoamBlock,
  getLinkedPageReferences,
} from "roam-client";

const menuItemCallback = (
  sortContainer: Element,
  sortBy: (a: RoamBlock, b: RoamBlock) => number
) => {
  const pageTitle = getPageTitle(sortContainer);
  if (!pageTitle) {
    return;
  }
  const linkedReferences = getLinkedPageReferences(pageTitle.textContent);
  linkedReferences.sort(sortBy);
  const refIndexByTitle: { [key: string]: number } = {};
  linkedReferences.forEach((v, i) => (refIndexByTitle[v.title] = i));

  const refContainer = sortContainer.parentElement
    .closest(".rm-reference-container")
    ?.getElementsByClassName("refs-by-page-view")[0];
  const refsInView = Array.from(refContainer.children);
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

const sortCallbacks = {
  "Page Title": (refContainer: Element) => () =>
    menuItemCallback(refContainer, (a, b) => a.title.localeCompare(b.title)),
  "Page Title Descending": (refContainer: Element) => () =>
    menuItemCallback(refContainer, (a, b) => b.title.localeCompare(a.title)),
  "Created Date": (refContainer: Element) => () =>
    menuItemCallback(refContainer, (a, b) => a.time - b.time),
  "Created Date Descending": (refContainer: Element) => () =>
    menuItemCallback(refContainer, (a, b) => b.time - a.time),
  "Daily Note": (refContainer: Element) => () =>
    menuItemCallback(refContainer, (a, b) => {
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
  "Daily Note Descending": (refContainer: Element) => () =>
    menuItemCallback(refContainer, (a, b) => {
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

const createSortIconCallback = (container: HTMLDivElement) => {
  const thisPageConfig = getConfigFromPage();
  const thisPageDefaultSort = thisPageConfig[
    "Default Sort"
  ] as keyof typeof sortCallbacks;
  if (thisPageDefaultSort && sortCallbacks[thisPageDefaultSort]) {
    sortCallbacks[thisPageDefaultSort](container)();
    return;
  }

  const config = getConfigFromPage("roam/js/sort-references");
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
        ?.getElementsByClassName("refs-by-page-view")[0]
  );

runExtension("sort-references", () => {
  createObserver(observerCallback);
});
