import { render } from "../components/Marketplace";
import { runExtension } from "../entry-helpers";
import { createHTMLObserver } from "roam-client";

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
