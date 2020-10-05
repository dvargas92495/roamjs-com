import { createIconButton, createObserver } from "../entry-helpers";

const observerCallback = () => {
  const tables = Array.from(document.getElementsByClassName("roam-table"));
  tables.forEach((t) => {
    const ths = Array.from(t.getElementsByTagName("th"));
    ths.forEach((th) => {
      if (th.getElementsByClassName("bp3-icon").length > 0) {
        return;
      }
      const sortButton = createIconButton();
      th.appendChild(sortButton);
      sortButton.onclick = () => {
        const icon = sortButton.children[0];
        if (icon.className.indexOf("bp3-icon-sort-alphabetical-desc") > -1) {
          icon.className = "bp3-icon bp3-icon-sort";
        } else if (icon.className.indexOf("bp3-icon-sort-alphabetical") > -1) {
          icon.className = "bp3-icon bp3-icon-sort-alphabetical-desc";
        } else if (icon.className.indexOf("bp3-icon-sort") > -1) {
          icon.className = "bp3-icon bp3-icon-sort-alphabetical";
        }
      };
    });
  });
};
observerCallback();
createObserver(observerCallback);
