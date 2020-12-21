import { render } from "../components/Marketplace";
import { createHTMLObserver, runExtension } from "../entry-helpers";

runExtension("marketplace", () => {
  createHTMLObserver({
    tag: "DIV",
    className: "roam-topbar",
    callback: (d: HTMLElement) => {
      if (!d.hasAttribute("data-roamjs-marketplace")) {
        d.setAttribute("data-roamjs-marketplace", "true");
        const flexSpacer = d.children[0].getElementsByTagName("div")[0];
        const parent = document.createElement("span");
        flexSpacer.parentElement.insertBefore(parent, flexSpacer);
        render(parent);
      }
    },
  });
});
