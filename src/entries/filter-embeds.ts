import { createHTMLObserver, runExtension } from "../entry-helpers";

const isPopoverThePageFilter = (popover?: HTMLElement) => {
  if (popover) {
    const strongs = Array.from(popover.getElementsByTagName("strong")).map(
      (e) => e.innerText
    );
    if (strongs.includes("Includes") && strongs.includes("Removes")) {
      const transform = popover.style.transform;
      // this is the only way I know how to differentiate between the two filters
      if (
        transform.startsWith("translate3d(") &&
        transform.endsWith("px, 50px, 0px)")
      ) {
        return true;
      }
    }
  }
  return false;
};

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
        const targetTag = button.firstChild.nodeValue;
        const includeRemoveContainer = button.closest(".flex-h-box");
        const embeds = Array.from(
          document.getElementsByClassName("rm-embed-container")
        ).map((e) => e as HTMLDivElement);
        const editBlockStyle = (style: string) =>
          embeds.forEach((e) => filterEmbed({ e, targetTag, style }));
        if (includeRemoveContainer) {
          if (includeRemoveContainer.lastElementChild.contains(button)) {
            editBlockStyle("");
          }
          /* Skipping Includes logic for now
          else if (includeRemoveContainer.firstElementChild.contains(button)) {
            console.log("uninclude", targetTag);
          }
          */
        } else {
          if (e.shiftKey) {
            editBlockStyle("none");
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
      const filter = document
        .getElementsByClassName("roam-topbar")[0]
        .getElementsByClassName("bp3-icon-filter")[0] as HTMLSpanElement;
      if (filter.style.color === "rgb(168, 42, 42)") {
        if (
          !Array.from(
            document.getElementsByClassName("bp3-popover-enter-done")
          ).some(isPopoverThePageFilter)
        ) {
          filter.click();
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        const filterPopover = Array.from(
          document.getElementsByClassName("bp3-popover-enter-done")
        ).find(isPopoverThePageFilter);
        const includeRemoveContainer = filterPopover.getElementsByClassName(
          "flex-h-box"
        )[0];
        const removeTags = Array.from(
          includeRemoveContainer.lastElementChild.getElementsByClassName(
            "bp3-button"
          )
        ).map((b) => b.firstChild.nodeValue);
        filter.click();
        removeTags.forEach((targetTag) =>
          filterEmbed({
            e,
            style: "none",
            targetTag,
          })
        );
      }
      console.log("heres an embed");
    },
  });
});
