import {
  createObserver,
  createSortIcons,
  getConfigFromBlock,
  getCreatedTimeByTitle,
  getEditTimeByTitle,
} from "../entry-helpers";
import { parseRoamDate } from "roam-client";

const menuItemCallback = (
  sortContainer: Element,
  sortBy: (a: string, b: string) => number
) => () => {
  const refContainer = sortContainer.getElementsByClassName(
    "refs-by-page-view"
  )[0];
  const refsInView = Array.from(
    refContainer.getElementsByClassName("rm-ref-page-view")
  );
  refsInView.forEach((r) => refContainer.removeChild(r));
  refsInView.sort((a, b) => {
    const aTitle = a.getElementsByClassName(
      "rm-ref-page-view-title"
    )[0] as HTMLDivElement;
    const bTitle = b.getElementsByClassName(
      "rm-ref-page-view-title"
    )[0] as HTMLDivElement;
    return sortBy(aTitle.textContent, bTitle.textContent);
  });
  refsInView.forEach((r) => refContainer.appendChild(r));
};

const sortCallbacks = {
  "Page Title": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) => a.localeCompare(b)),
  "Page Title Descending": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) => b.localeCompare(a)),
  "Created Date": (refContainer: Element) =>
    menuItemCallback(
      refContainer,
      (a, b) => getCreatedTimeByTitle(a) - getCreatedTimeByTitle(b)
    ),
  "Created Date Descending": (refContainer: Element) =>
    menuItemCallback(
      refContainer,
      (a, b) => getCreatedTimeByTitle(b) - getCreatedTimeByTitle(a)
    ),
  "Edited Date": (refContainer: Element) =>
    menuItemCallback(
      refContainer,
      (a, b) => getEditTimeByTitle(a) - getEditTimeByTitle(b)
    ),
  "Edited Date Descending": (refContainer: Element) =>
    menuItemCallback(
      refContainer,
      (a, b) => getEditTimeByTitle(b) - getEditTimeByTitle(a)
    ),
  "Daily Note": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) => {
      const aDate = parseRoamDate(a).valueOf();
      const bDate = parseRoamDate(b).valueOf();
      if (isNaN(aDate) && isNaN(bDate)) {
        return getCreatedTimeByTitle(a) - getCreatedTimeByTitle(b);
      } else if (isNaN(aDate)) {
        return 1;
      } else if (isNaN(bDate)) {
        return -1;
      } else {
        return aDate - bDate;
      }
    }),
  "Daily Note Descending": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) => {
      const aDate = parseRoamDate(a).valueOf();
      const bDate = parseRoamDate(b).valueOf();
      if (isNaN(aDate) && isNaN(bDate)) {
        return getCreatedTimeByTitle(b) - getCreatedTimeByTitle(a);
      } else if (isNaN(aDate)) {
        return 1;
      } else if (isNaN(bDate)) {
        return -1;
      } else {
        return bDate - aDate;
      }
    }),
};

const onCreateSortIcons = (container: HTMLDivElement) => {
  const config = getConfigFromBlock(container);

  const defaultSort = config["Default Sort"] as keyof typeof sortCallbacks;
  if (defaultSort && sortCallbacks[defaultSort]) {
    sortCallbacks[defaultSort](container)();
  }
};

const observerCallback = () =>
  createSortIcons("rm-query-content", onCreateSortIcons, sortCallbacks, 1);
observerCallback();
createObserver(observerCallback);
