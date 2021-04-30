import {
  createSortIcons,
  getConfigFromBlock,
  getCreatedTimeByTitle,
  getEditTimeByTitle,
  getWordCountByBlockUid,
  getWordCountByPageTitle,
  runExtension,
} from "../entry-helpers";
import {
  createObserver,
  getCreateTimeByBlockUid,
  getConfigFromPage,
  getEditTimeByBlockUid,
  getTextByBlockUid,
  parseRoamDate,
  createIconButton,
  getUids,
} from "roam-client";

let isSortByBlocks = false;

const menuItemCallback = (
  sortContainer: Element,
  sortBy: (a: string, b: string) => number
) => () => {
  const blockConfig = getConfigFromBlock(sortContainer as HTMLDivElement);
  const pageConfig = getConfigFromPage("roam/js/query-tools");
  isSortByBlocks = !!blockConfig["Sort Blocks"] || !!pageConfig["Sort Blocks"];
  const refContainer = sortContainer.getElementsByClassName(
    "refs-by-page-view"
  )[0];
  const refsInView = Array.from(
    refContainer.getElementsByClassName("rm-ref-page-view")
  );
  refsInView.forEach((r) => refContainer.removeChild(r));
  if (isSortByBlocks) {
    const blocksInView = refsInView.flatMap((r) =>
      Array.from(r.lastElementChild.children).filter(
        (c) => (c as HTMLDivElement).style.display !== "none"
      ).length === 1
        ? [r]
        : Array.from(r.lastElementChild.children).map((c) => {
            const refClone = r.cloneNode(true) as HTMLDivElement;
            Array.from(refClone.lastElementChild.children).forEach((cc) => {
              const ccDiv = cc as HTMLDivElement;
              if (
                cc.getElementsByClassName("roam-block")[0]?.id ===
                c.getElementsByClassName("roam-block")[0]?.id
              ) {
                ccDiv.style.display = "flex";
              } else {
                ccDiv.style.display = "none";
              }
            });
            return refClone;
          })
    );
    const getRoamBlock = (e: Element) =>
      Array.from(e.lastElementChild.children)
        .filter((c) => (c as HTMLDivElement).style.display != "none")[0]
        .getElementsByClassName("roam-block")[0] as HTMLDivElement;
    blocksInView.sort((a, b) => {
      const { blockUid: aUid } = getUids(getRoamBlock(a));
      const { blockUid: bUid } = getUids(getRoamBlock(b));
      return sortBy(aUid, bUid);
    });
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
    menuItemCallback(refContainer, (a, b) =>
      isSortByBlocks
        ? getTextByBlockUid(a).localeCompare(getTextByBlockUid(b))
        : a.localeCompare(b)
    ),
  "Page Title Descending": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) =>
      isSortByBlocks
        ? getTextByBlockUid(b).localeCompare(getTextByBlockUid(a))
        : b.localeCompare(a)
    ),
  "Word Count": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) =>
      isSortByBlocks
        ? getWordCountByBlockUid(a) - getWordCountByBlockUid(b)
        : getWordCountByPageTitle(a) - getWordCountByPageTitle(b)
    ),
  "Word Count Descending": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) =>
      isSortByBlocks
        ? getWordCountByBlockUid(b) - getWordCountByBlockUid(a)
        : getWordCountByPageTitle(b) - getWordCountByPageTitle(a)
    ),
  "Created Date": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) =>
      isSortByBlocks
        ? getCreateTimeByBlockUid(a) - getCreateTimeByBlockUid(b)
        : getCreatedTimeByTitle(a) - getCreatedTimeByTitle(b)
    ),
  "Created Date Descending": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) =>
      isSortByBlocks
        ? getCreateTimeByBlockUid(b) - getCreateTimeByBlockUid(a)
        : getCreatedTimeByTitle(b) - getCreatedTimeByTitle(a)
    ),
  "Edited Date": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) =>
      isSortByBlocks
        ? getEditTimeByBlockUid(a) - getEditTimeByBlockUid(b)
        : getEditTimeByTitle(a) - getEditTimeByTitle(b)
    ),
  "Edited Date Descending": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) =>
      isSortByBlocks
        ? getEditTimeByBlockUid(b) - getEditTimeByBlockUid(a)
        : getEditTimeByTitle(b) - getEditTimeByTitle(a)
    ),
  "Daily Note": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) => {
      const aText = isSortByBlocks ? getTextByBlockUid(a) : a;
      const bText = isSortByBlocks ? getTextByBlockUid(b) : b;
      const aDate = parseRoamDate(aText).valueOf();
      const bDate = parseRoamDate(bText).valueOf();
      if (isNaN(aDate) && isNaN(bDate)) {
        return isSortByBlocks
          ? getCreateTimeByBlockUid(a) - getCreateTimeByBlockUid(b)
          : getCreatedTimeByTitle(a) - getCreatedTimeByTitle(b);
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
      const aText = isSortByBlocks ? getTextByBlockUid(a) : a;
      const bText = isSortByBlocks ? getTextByBlockUid(b) : b;
      const aDate = parseRoamDate(aText).valueOf();
      const bDate = parseRoamDate(bText).valueOf();
      if (isNaN(aDate) && isNaN(bDate)) {
        return isSortByBlocks
          ? getCreateTimeByBlockUid(b) - getCreateTimeByBlockUid(a)
          : getCreatedTimeByTitle(b) - getCreatedTimeByTitle(a);
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
  const pageConfig = getConfigFromPage("roam/js/query-tools");
  const config = getConfigFromBlock(container);

  const defaultSort = (config["Default Sort"] ||
    pageConfig["Default Sort"]) as keyof typeof sortCallbacks;
  if (defaultSort && sortCallbacks[defaultSort]) {
    sortCallbacks[defaultSort](container)();
  }
};

const randomize = (q: HTMLDivElement) => {
  const config = getConfigFromBlock(q);
  const numRandomResults = Math.max(
    Number.isNaN(config["Random"]) ? 1 : parseInt(config["Random"]),
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

  // Randomization
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

  // Context
  const unContextedQueries = Array.from(
    document.getElementsByClassName("rm-query-content")
  ).filter(
    (e) => !e.getAttribute("data-is-contexted-results")
  ) as HTMLDivElement[];
  if (unContextedQueries.length) {
    const pageConfig = getConfigFromPage("roam/js/query-tools");
    unContextedQueries.forEach((q) => {
      const config = getConfigFromBlock(q);
      const configContext = config["Context"] || pageConfig["Context"];
      if (configContext) {
        q.setAttribute("data-is-contexted-results", "true");
        const context = isNaN(configContext)
          ? configContext
          : parseInt(configContext);
        const contexts = Array.from(
          q.getElementsByClassName("zoom-mentions-view")
        ).filter((c) => c.childElementCount);
        contexts.forEach((ctx) => {
          const children = Array.from(
            ctx.children
          ).reverse() as HTMLDivElement[];
          const index = !isNaN(context)
            ? Math.min(context, children.length)
            : children.length;
          children[index - 1].click();
        });
      }
    });
  }
};

runExtension("query-tools", () => {
  observerCallback();
  createObserver(observerCallback);
});
