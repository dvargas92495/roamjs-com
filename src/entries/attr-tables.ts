import {
  createIconButton,
  createObserver,
  getConfigFromBlock,
} from "../entry-helpers";

type SortConfig = {
  [column: string]: {
    asc: boolean | undefined;
    index: number;
    priority: number;
  };
};

const PRIORITY_LABEL_CLASSNAME = "attr-table-priority-label";

const createPriorityLabel = (p: number) => {
  const span = document.createElement("span");
  span.className = PRIORITY_LABEL_CLASSNAME;
  span.innerText = `(${p})`;
  return span;
};

const getKey = (h: HTMLTableHeaderCellElement) =>
  h.childNodes[0].nodeValue || (h.children[0] as HTMLElement).innerText;

const getMaxPriority = (sortConfig: SortConfig) =>
  Math.max(...Object.values(sortConfig).map((v) => v.priority));

const sortTable = (t: HTMLTableElement, sortConfig: SortConfig) => {
  const headers = Array.from(t.getElementsByTagName("th"));
  headers.forEach((h) => {
    const { priority: p, asc } = sortConfig[getKey(h)];
    const span = h.getElementsByClassName(
      PRIORITY_LABEL_CLASSNAME
    )[0] as HTMLSpanElement;
    if (p > 0) {
      if (!span) {
        h.appendChild(createPriorityLabel(p));
      } else {
        span.innerText = `(${p})`;
      }
    } else if (!!span) {
      h.removeChild(span);
    }

    const icon = h.getElementsByClassName("bp3-icon")[0];
    if (asc === undefined) {
      icon.className = "bp3-icon bp3-icon-sort";
    } else if (asc) {
      icon.className = "bp3-icon bp3-icon-sort-alphabetical";
    } else {
      icon.className = "bp3-icon bp3-icon-sort-alphabetical-desc";
    }
  });

  const body = t.getElementsByTagName("tbody")[0];
  const rows = Array.from(body.children);
  const sorts = Object.values(sortConfig).filter((c) => c.asc !== undefined);
  sorts.sort((a, b) => a.priority - b.priority);
  rows.forEach((r) => body.removeChild(r));
  rows.sort((a, b) => {
    for (var k in sorts) {
      const config = sorts[k];
      if (config.asc !== undefined) {
        const aData = (a.children[config.index] as HTMLTableDataCellElement)
          .innerText;
        const bData = (b.children[config.index] as HTMLTableDataCellElement)
          .innerText;
        if (aData !== bData) {
          return config.asc
            ? aData.localeCompare(bData)
            : bData.localeCompare(aData);
        }
      }
    }
    return 0;
  });
  rows.forEach((r) => body.appendChild(r));
};

const observerCallback = () => {
  const tables = Array.from(
    document.getElementsByClassName("roam-table")
  ) as HTMLTableElement[];
  tables.forEach((t) => {
    if (t.getElementsByClassName("bp3-icon").length > 0) {
      return;
    }
    const ths = Array.from(t.getElementsByTagName("th"));
    const sortConfig: SortConfig = {};
    ths.forEach((th, index) => {
      sortConfig[th.innerText] = { asc: undefined, index, priority: 0 };
      const sortButton = createIconButton();
      th.appendChild(sortButton);
      sortButton.onclick = () => {
        const icon = sortButton.children[0];
        const key = getKey(th);
        if (icon.className.indexOf("bp3-icon-sort-alphabetical-desc") > -1) {
          sortConfig[key].asc = undefined;
          const oldPriority = sortConfig[key].priority;
          const maxPriority = getMaxPriority(sortConfig);
          const values = Object.values(sortConfig);
          for (var p = oldPriority + 1; p <= maxPriority; p++) {
            const config = values.find((v) => v.priority === p);
            config.priority--;
          }
          sortConfig[key].priority = 0;
        } else if (icon.className.indexOf("bp3-icon-sort-alphabetical") > -1) {
          sortConfig[key].asc = false;
        } else if (icon.className.indexOf("bp3-icon-sort") > -1) {
          sortConfig[key].asc = true;
          sortConfig[key].priority = getMaxPriority(sortConfig) + 1;
        }
        sortTable(t, sortConfig);
      };
    });
    const config = getConfigFromBlock(t);
    const defaultSort = (config["Default Sort"]
      ?.split(",")
      ?.map((s: string) => s.trim()) || []) as string[];
    defaultSort.forEach((s: string, i: number) => {
      const parts = s.split("=").map((s: string) => s.trim());
      sortConfig[parts[0]].priority = i + 1;
      sortConfig[parts[0]].asc = (parts[1].toUpperCase() === 'ASC');
    });
    if (defaultSort.length) {
      sortTable(t, sortConfig);
    }
  });
};
observerCallback();
createObserver(observerCallback);
