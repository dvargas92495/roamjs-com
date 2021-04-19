import {
  createHTMLObserver,
  getUids,
  getPageTitleByBlockUid,
} from "roam-client";
import { getPageTitle, isPopoverThePageFilter, runExtension } from "../entry-helpers";

const KEY = "roamjsPageFilters";
type Filter = {
  [pagename: string]: { removes: string[] };
};

if (!localStorage.getItem(KEY)) {
  localStorage.setItem(KEY, JSON.stringify({}));
}

const getRemoveTags = (includeRemoveContainer: Element) =>
  Array.from(
    includeRemoveContainer.lastElementChild.getElementsByClassName("bp3-button")
  ).map((b) => b.firstChild.nodeValue);

const filterEmbed = ({
  e,
  style,
  targetTag,
}: {
  e: HTMLDivElement;
  style: string;
  targetTag: string;
}) => {
  const blocks = Array.from(e.getElementsByClassName("roam-block"));
  blocks
    .map((b) => b.closest(".rm-block") as HTMLDivElement)
    .filter((b) => !!b)
    .forEach((b) => {
      const pageLinks = b.getAttribute("data-page-links");
      const tags = pageLinks
        .substring(1, pageLinks.length - 1)
        .split(",")
        .map((t) => t.substring(1, t.length - 1));
      if (tags.includes(targetTag)) {
        b.style.display = style;
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
        const embeds = Array.from(
          document.getElementsByClassName("rm-embed-container")
        ).map((e) => e as HTMLDivElement);
        if (!storage[title]) {
          currentFilters.forEach((t) =>
            embeds.forEach((e) =>
              filterEmbed({ e, targetTag: t, style: "none" })
            )
          );
        }
        if (includeRemoveContainer) {
          if (includeRemoveContainer.lastElementChild.contains(button)) {
            embeds.forEach((e) => filterEmbed({ e, targetTag, style: "" }));
            localStorage.setItem(
              KEY,
              JSON.stringify({
                ...storage,
                [title]: {
                  removes: currentFilters.filter((f) => f !== targetTag),
                },
              })
            );
          }
          /* Skipping Includes logic for now
          else if (includeRemoveContainer.firstElementChild.contains(button)) {
            console.log("uninclude", targetTag);
          }
          */
        } else {
          if (e.shiftKey) {
            embeds.forEach((e) => filterEmbed({ e, targetTag, style: "none" }));
            localStorage.setItem(
              KEY,
              JSON.stringify({
                ...storage,
                [title]: {
                  removes: [...currentFilters, targetTag],
                },
              })
            );
          }
          /* Skipping Includes logic for now
          else {
            console.log("include", targetTag);
          }
          */
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
        storage[title].removes.forEach((targetTag) =>
          filterEmbed({
            e,
            style: "none",
            targetTag,
          })
        );
      }
      const currentTitle = getPageTitle(e).textContent;
      if (storage[currentTitle]) {
        storage[currentTitle].removes.forEach((targetTag) =>
          filterEmbed({
            e,
            style: "none",
            targetTag,
          })
        );
      }
    },
  });
});
