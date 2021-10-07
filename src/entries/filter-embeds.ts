import {
  createHTMLObserver,
  getUids,
  getPageTitleByBlockUid,
} from "roam-client";
import {
  getPageTitle,
  isPopoverThePageFilter,
  runExtension,
} from "../entry-helpers";

const KEY = "roamjsPageFilters";
type Filter = {
  [pagename: string]: { removes: string[]; includes: string[] };
};

if (!localStorage.getItem(KEY)) {
  localStorage.setItem(KEY, JSON.stringify({}));
}

const getRemoveTags = (includeRemoveContainer: Element) =>
  Array.from(
    includeRemoveContainer.lastElementChild.getElementsByClassName("bp3-button")
  ).map((b) => b.firstChild.nodeValue);

const getIncludeTags = (includeRemoveContainer: Element) =>
  Array.from(
    includeRemoveContainer.lastElementChild.getElementsByClassName("bp3-button")
  ).map((b) => b.firstChild.nodeValue);

const filterEmbed = ({
  e,
  includes = [],
  removes = [],
}: {
  e: HTMLDivElement;
  includes: string[];
  removes: string[];
}) => {
  const blocks = Array.from(e.getElementsByClassName("roam-block"));
  const blockIdToResult: { [id: string]: boolean } = {};
  blocks
    .map((b) => b.closest(".rm-block") as HTMLDivElement)
    .filter((b) => !!b)
    .forEach((b) => {
      const pageLinks = b.getAttribute("data-page-links");
      const tags = pageLinks
        .substring(1, pageLinks.length - 1)
        .split(",")
        .map((t) => t.substring(1, t.length - 1));
      const blockId = b.querySelector(".roam-block")?.id;
      const filterOut =
        removes.some((t) => tags.includes(t)) ||
        (includes.length &&
          !includes.every((t) => tags.includes(t)) &&
          !blockIdToResult[
            b.parentElement
              .closest(".roam-block-container")
              ?.querySelector?.(".roam-block")?.id
          ]);
      if (filterOut) {
        b.style.display = "none";
      } else {
        b.style.display = "";
      }
      if (blockId) {
        blockIdToResult[blockId] = !filterOut;
      }
    });
};

runExtension("filter-embeds", () => {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "BUTTON") {
      const button = target as HTMLButtonElement;
      const popover = button.closest(".bp3-popover-enter-done") as HTMLElement;
      if (isPopoverThePageFilter(popover)) {
        const title = getPageTitle(button).textContent;
        const targetTag = button.firstChild.nodeValue;
        const storage = JSON.parse(localStorage.getItem(KEY)) as Filter;
        const includeRemoveContainer = button.closest(".flex-h-box");
        const currentFilters =
          storage[title]?.removes ||
          getRemoveTags(popover.getElementsByClassName("flex-h-box")[0]);
        const currentIncludes =
          storage[title]?.includes ||
          getIncludeTags(popover.getElementsByClassName("flex-h-box")[0]);
        const embeds = Array.from(
          document.getElementsByClassName("rm-embed-container")
        ).map((e) => e as HTMLDivElement);
        if (!storage[title]) {
          embeds.forEach((e) =>
            filterEmbed({
              e,
              includes: currentIncludes,
              removes: currentFilters,
            })
          );
        }
        if (includeRemoveContainer) {
          if (includeRemoveContainer.lastElementChild.contains(button)) {
            const titleData = {
              removes: currentFilters.filter((f) => f !== targetTag),
              includes: currentIncludes,
            };
            embeds.forEach((e) => filterEmbed({ e, ...titleData }));
            localStorage.setItem(
              KEY,
              JSON.stringify({
                ...storage,
                [title]: titleData,
              })
            );
          } else if (
            includeRemoveContainer.firstElementChild.contains(button)
          ) {
            const titleData = {
              removes: currentFilters,
              includes: currentIncludes.filter((f) => f !== targetTag),
            };
            embeds.forEach((e) => filterEmbed({ e, ...titleData }));
            localStorage.setItem(
              KEY,
              JSON.stringify({
                ...storage,
                [title]: titleData,
              })
            );
          }
        } else {
          if (e.shiftKey) {
            const titleData = {
              removes: [...currentFilters, targetTag],
              includes: currentIncludes,
            };
            embeds.forEach((e) => filterEmbed({ e, ...titleData }));
            localStorage.setItem(
              KEY,
              JSON.stringify({
                ...storage,
                [title]: titleData,
              })
            );
          } else {
            const titleData = {
              removes: currentFilters,
              includes: [...currentIncludes, targetTag],
            };
            embeds.forEach((e) => filterEmbed({ e, ...titleData }));
            localStorage.setItem(
              KEY,
              JSON.stringify({
                ...storage,
                [title]: titleData,
              })
            );
          }
        }
      }
    }
  });
  createHTMLObserver({
    tag: "DIV",
    className: "rm-embed-container",
    callback: async (e: HTMLDivElement) => {
      const topBlock = e.getElementsByClassName(
        "roam-block"
      )[0] as HTMLDivElement;
      const { blockUid } = getUids(topBlock);
      const title = getPageTitleByBlockUid(blockUid);
      const storage = JSON.parse(localStorage.getItem(KEY)) as Filter;
      if (storage[title]) {
        filterEmbed({
          e,
          ...storage[title],
        });
      }
      const currentTitle = getPageTitle(e).textContent;
      if (storage[currentTitle]) {
        filterEmbed({
          e,
          ...storage[title],
        });
      }
    },
  });
});
