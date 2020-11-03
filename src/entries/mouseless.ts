import { renderMouselessDialog } from "../components/MouselessDialog";
import { createHTMLObserver, isControl } from "../entry-helpers";

const container = document.createElement("div");
container.id = "roamjs-mouseless-root";
document.body.appendChild(container);
renderMouselessDialog(container as HTMLDivElement);

createHTMLObserver(
  (b) => {
    if (b.tabIndex < 0) {
      b.tabIndex = 0;
    }
  },
  "SPAN",
  "bp3-icon"
);

document.addEventListener("keydown", (e) => {
  if (isControl(e)) {
    if (e.shiftKey) {
      if (e.key === "S") {
        const shortcuts = document.getElementsByClassName(
          "bp3-icon-star-empty"
        ) as HTMLCollectionOf<HTMLSpanElement>;
        shortcuts[0]?.click();
      }
    }
  } else {
    if (e.key === "Enter") {
      const element = e.target as HTMLElement;
      if (element.className.indexOf("bp3-button") > -1) {
        element.click();
      }
    }
  }
});
