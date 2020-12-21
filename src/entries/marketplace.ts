import { createHTMLObserver, runExtension } from "../entry-helpers";

runExtension("marketplace", () => {
  createHTMLObserver({
    tag: "DIV",
    className: "roam-topbar",
    callback: (d: HTMLElement) => {
       const flexSpacer = d.children[0].getElementsByTagName('div')[0];
       const parent = document.createElement('span');
       flexSpacer.parentElement.insertBefore(parent, flexSpacer);
       
    },
  });
});
