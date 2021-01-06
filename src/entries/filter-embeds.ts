import { runExtension } from "../entry-helpers";

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
            transform.endsWith("px, 50px, 0px);")
          ) {
            const includeRemoveContainer = popover.getElementsByClassName(
              "flex-h-box"
            )[0];
            const includes = Array.from(
              includeRemoveContainer.firstElementChild.getElementsByTagName(
                "button"
              )
            ).map((b) => b.firstChild.nodeValue);
            const removes = Array.from(
                includeRemoveContainer.lastElementChild.getElementsByTagName(
                  "button"
                )
              ).map((b) => b.firstChild.nodeValue);
            console.log(includes, removes);  
          }
        }
      }
    }
  });
});
