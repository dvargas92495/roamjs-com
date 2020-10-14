import {
  createIconButton,
  createObserver,
  createSortIcons,
  getConfigFromBlock,
  getCreatedTimeByTitle,
  getEditTimeByTitle,
} from "../entry-helpers";
import { getConfigFromPage, parseRoamDate } from "roam-client";

const menuItemCallback = (
  sortContainer: Element,
  sortBy: (a: string, b: string) => number
) => () => {
  const blockConfig = getConfigFromBlock(sortContainer as HTMLDivElement);
  const pageConfig = getConfigFromPage("roam/js/query-tools");
  const sortByBlocks =
    !!blockConfig["Sort Blocks"] || !!pageConfig["Sort Blocks"];

  const refContainer = sortContainer.getElementsByClassName(
    "refs-by-page-view"
  )[0];
  const refsInView = Array.from(
    refContainer.getElementsByClassName("rm-ref-page-view")
  );
  refsInView.forEach((r) => refContainer.removeChild(r));
  if (sortByBlocks) {
    const blocksInView = refsInView.flatMap((r) =>
      r.childElementCount === 1
        ? [r]
        : Array.from(r.children).map((c) => {
            const refClone = r.cloneNode(true) as HTMLDivElement;
            Array.from(refClone.lastElementChild.children).forEach((cc) => {
              const ccDiv = cc as HTMLDivElement;
              if (cc.getElementsByClassName("roam-block")[0]?.id === c.id) {
                ccDiv.style.display = "flex";
              } else {
                ccDiv.style.display = "none";
              }
            });
            return refClone;
          })
    );
    blocksInView.sort((a, b) => {
      const aTitle = a.getElementsByClassName(
        "roam-block"
      )[0] as HTMLDivElement;
      const bTitle = b.getElementsByClassName(
        "roam-block"
      )[0] as HTMLDivElement;
      return sortBy(aTitle.textContent, bTitle.textContent);
    })
    blocksInView.forEach((r) => refContainer.appendChild(r));
  } else {
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
  }
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

const randomize = (q: HTMLDivElement) => {
  const config = getConfigFromBlock(q);
  const numRandomResults = Math.max(
    isNaN(config["Random"]) ? 1 : parseInt(config["Random"]),
    1
  );
  const refsByPageView = q.lastElementChild;
  const allChildren = Array.from(q.getElementsByClassName("rm-reference-item"));
  const selected = allChildren
    .sort(() => 0.5 - Math.random())
    .slice(0, numRandomResults);
  Array.from(refsByPageView.children).forEach((c: HTMLElement) => {
    if (selected.find((s) => c.contains(s))) {
      const itemContainer = c.lastElementChild;
      Array.from(itemContainer.children).forEach((cc: HTMLElement) => {
        if (selected.find((s) => cc.contains(s))) {
          cc.style.display = "flex";
          c.style.display = "block";
        } else {
          cc.style.display = "none";
        }
      });
    } else {
      c.style.display = "none";
    }
  });
};

const observerCallback = () => {
  createSortIcons("rm-query-content", onCreateSortIcons, sortCallbacks, 1);
  const queries = Array.from(
    document.getElementsByClassName("rm-query-content")
  ).filter(
    (e) => !e.getAttribute("data-is-random-results")
  ) as HTMLDivElement[];
  queries.forEach((q) => {
    const config = getConfigFromBlock(q);
    if (config["Random"]) {
      q.setAttribute("data-is-random-results", "true");
      const randomIcon = createIconButton("reset");
      q.insertBefore(randomIcon, q.lastElementChild);
      randomIcon.onclick = (e) => {
        randomize(q);
        e.stopPropagation();
        e.preventDefault();
      };
      randomIcon.onmousedown = (e) => {
        e.stopImmediatePropagation();
        e.preventDefault();
      };
      randomize(q);
    }
  });
};

observerCallback();
createObserver(observerCallback);
