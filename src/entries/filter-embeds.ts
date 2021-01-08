import { createHTMLObserver, runExtension } from "../entry-helpers";

runExtension("filter-embeds", () => {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "BUTTON") {
      const button = target as HTMLButtonElement;
      const popover = button.closest(".bp3-popover-enter-done") as HTMLElement;
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
            const targetTag = button.firstChild.nodeValue;
            const includeRemoveContainer = button.closest(".flex-h-box");
            const embeds = Array.from(
              document.getElementsByClassName("rm-embed-container")
            );
            const editBlockStyle = (style: string) =>
              embeds.forEach((e) => {
                const blocks = Array.from(
                  e.getElementsByClassName("roam-block")
                );
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
              });
            if (includeRemoveContainer) {
              if (includeRemoveContainer.firstElementChild.contains(button)) {
                console.log("uninclude", targetTag);
              } else if (
                includeRemoveContainer.lastElementChild.contains(button)
              ) {
                editBlockStyle('');
              }
            } else {
              if (e.shiftKey) {
                editBlockStyle('none');
              } else {
                console.log("include", targetTag);
              }
            }
          }
        }
      }
    }
  });
  createHTMLObserver({
    tag: 'DIV',
    className: 'rm-embed-container',
    callback: (d: HTMLDivElement) => {
      console.log('heres an embed');
    },
    removeCallback: (d: HTMLDivElement) => {
      console.log('goodbye embed');
    }  
  })
});
