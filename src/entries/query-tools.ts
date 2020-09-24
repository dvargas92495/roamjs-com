import parse from "date-fns/parse";
import { createObserver, createSortIcons } from "../entry-helpers";

const menuItemCallback = (
  sortContainer: Element,
  sortBy: (a: string, b: string) => number
) => {
  const refContainer = sortContainer.getElementsByClassName("refs-by-page-view")[0];
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
 // "Created Date": (refContainer: Element) =>
 //   menuItemCallback(refContainer, (a, b) => a.time - b.time),
 // "Created Date Descending": (refContainer: Element) =>
 //   menuItemCallback(refContainer, (a, b) => b.time - a.time),
  "Daily Note": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) => {
      const aDate = parse(a, "MMMM do, yyyy", new Date()).valueOf();
      const bDate = parse(b, "MMMM do, yyyy", new Date()).valueOf();
      if (isNaN(aDate) && isNaN(bDate)) {
        return a.length - b.length;
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
      const aDate = parse(a, "MMMM do, yyyy", new Date()).valueOf();
      const bDate = parse(b, "MMMM do, yyyy", new Date()).valueOf();
      if (isNaN(aDate) && isNaN(bDate)) {
        return b.length - a.length;
      } else if (isNaN(aDate)) {
        return 1;
      } else if (isNaN(bDate)) {
        return -1;
      } else {
        return bDate - aDate;
      }
    }),
};

const observerCallback = () =>
  createSortIcons("rm-query-content", () => {}, sortCallbacks, 1);

createObserver(observerCallback);
