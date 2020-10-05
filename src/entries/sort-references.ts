import parse from "date-fns/parse";
import {
  createObserver,
  createSortIcons,
  getConfigFromPage,
} from "../entry-helpers";

type RoamBlock = {
  title: string;
  time: number;
  id: number;
  uid: string;
};

const menuItemCallback = (
  sortContainer: Element,
  sortBy: (a: RoamBlock, b: RoamBlock) => number
) => {
  const container = sortContainer.closest(".roam-log-page") || document;
  const pageTitle = container.getElementsByClassName(
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
    sortCallbacks
  );

createObserver(observerCallback);
