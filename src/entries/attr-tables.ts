import { createIconButton, createObserver } from "../entry-helpers";

type SortConfig = { [column: string]: {
  asc: boolean | undefined,
  index: number;
} };

const sortTable = (t: HTMLTableElement, sortConfig: SortConfig) => {
  const body = t.getElementsByTagName('tbody')[0];
  const rows = Array.from(body.children);
  rows.forEach(r => body.removeChild(r));
  rows.sort((a, b) => {
    for (var k in sortConfig) {
      const config = sortConfig[k];
      if (config.asc !== undefined) {
        const aData = (a.children[config.index] as HTMLTableDataCellElement).innerText;
        const bData = (b.children[config.index] as HTMLTableDataCellElement).innerText;
        if (aData !== bData) {
          return config.asc ? aData.localeCompare(bData) : bData.localeCompare(aData);
        }
      }
    }
    return 0;
  })
  rows.forEach(r => body.appendChild(r));
}

const observerCallback = () => {
  const tables = Array.from(document.getElementsByClassName("roam-table")) as HTMLTableElement[];
  tables.forEach((t) => {
    const ths = Array.from(t.getElementsByTagName("th"));
    const sortConfig: SortConfig = {};
    ths.forEach((th, index) => {
      if (th.getElementsByClassName("bp3-icon").length > 0) {
        return;
      }
      sortConfig[th.innerText] = {asc: undefined, index } ;
      const sortButton = createIconButton();
      th.appendChild(sortButton);
      sortButton.onclick = () => {
        const icon = sortButton.children[0];
        if (icon.className.indexOf("bp3-icon-sort-alphabetical-desc") > -1) {
          icon.className = "bp3-icon bp3-icon-sort";
          sortConfig[th.innerText].asc = undefined;
        } else if (icon.className.indexOf("bp3-icon-sort-alphabetical") > -1) {
          icon.className = "bp3-icon bp3-icon-sort-alphabetical-desc";
          sortConfig[th.innerText].asc = false;
        } else if (icon.className.indexOf("bp3-icon-sort") > -1) {
          icon.className = "bp3-icon bp3-icon-sort-alphabetical";
          sortConfig[th.innerText].asc = true;
        }
        sortTable(t, sortConfig);
      };
    });
  });
};
observerCallback();
createObserver(observerCallback);
