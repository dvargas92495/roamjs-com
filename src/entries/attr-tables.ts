import createIconButton from "roamjs-components/dom/createIconButton";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import runExtension from "roamjs-components/util/runExtension";
import createObserver from "roamjs-components/dom/createObserver";
import { getConfigFromBlock } from "../entry-helpers";

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
    } else if (span) {
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
    for (const k in sorts) {
      const config = sorts[k];
      if (config.asc !== undefined) {
        const aData = (a.children[config.index] as HTMLTableDataCellElement)
          .innerText;
        const bData = (b.children[config.index] as HTMLTableDataCellElement)
          .innerText;
        if (aData !== bData) {
          if (config.asc) {
            const aDate = window.roamAlphaAPI.util
              .pageTitleToDate(aData)
              .valueOf();
            const bDate = window.roamAlphaAPI.util
              .pageTitleToDate(bData)
              .valueOf();
            if (!isNaN(aDate) && !isNaN(bDate)) {
              return aDate - bDate;
            }
            const aNum = parseInt(aData.replace(/,/g, ""));
            const bNum = parseInt(bData.replace(/,/g, ""));
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return aNum - bNum;
            }
            return aData.localeCompare(bData);
          } else {
            const aDate = window.roamAlphaAPI.util
              .pageTitleToDate(aData)
              .valueOf();
            const bDate = window.roamAlphaAPI.util
              .pageTitleToDate(bData)
              .valueOf();
            if (!isNaN(aDate) && !isNaN(bDate)) {
              return bDate - aDate;
            }
            const aNum = parseInt(aData.replace(/,/g, ""));
            const bNum = parseInt(bData.replace(/,/g, ""));
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return bNum - aNum;
            }
            return bData.localeCompare(aData);
          }
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
  tables
    .filter((t) => !t.hasAttribute("data-roamjs-attr-table"))
    .forEach((t) => {
      t.setAttribute("data-roamjs-attr-table", "true");
      const config = getConfigFromBlock(t);
      const ths = Array.from(t.getElementsByTagName("th"));
      const sortConfig: SortConfig = {};
      ths.forEach((th, index) => {
        sortConfig[th.innerText] = { asc: undefined, index, priority: 0 };
        const sortButton = createIconButton("sort");
        th.appendChild(sortButton);
        sortButton.onclick = () => {
          const pageConfig = Object.fromEntries(
            getFullTreeByParentUid(getPageUidByPageTitle("roam/js/attr-tables"))
              .children.map((c) => c.text.split("::"))
              .filter((c) => c.length === 2)
          );
          const maxSortsConfig = config["Max Sorts"] || pageConfig["Max Sorts"];
          const maxSorts = isNaN(maxSortsConfig) ? 0 : parseInt(maxSortsConfig);
          const icon = sortButton.children[0];
          const key = getKey(th);
          const values = Object.values(sortConfig);
          if (icon.className.indexOf("bp3-icon-sort-alphabetical-desc") > -1) {
            sortConfig[key].asc = undefined;
            const oldPriority = sortConfig[key].priority;
            const maxPriority = getMaxPriority(sortConfig);
            for (let p = oldPriority + 1; p <= maxPriority; p++) {
              const value = values.find((v) => v.priority === p);
              value.priority--;
            }
            sortConfig[key].priority = 0;
          } else if (
            icon.className.indexOf("bp3-icon-sort-alphabetical") > -1
          ) {
            sortConfig[key].asc = false;
          } else if (icon.className.indexOf("bp3-icon-sort") > -1) {
            sortConfig[key].asc = true;
            const maxPriority = getMaxPriority(sortConfig);
            if (maxSorts > 0 && maxSorts === maxPriority) {
              const value = values.find((v) => v.priority === maxPriority);
              value.asc = undefined;
              value.priority = 0;
              sortConfig[key].priority = maxPriority;
            } else {
              sortConfig[key].priority = maxPriority + 1;
            }
          }
          sortTable(t, sortConfig);
        };
      });

      const defaultSort = (config["Default Sort"]
        ?.split(",")
        ?.map((s: string) => s.trim()) || []) as string[];
      defaultSort.forEach((s: string, i: number) => {
        const parts = s.split("=").map((s: string) => s.trim());
        sortConfig[parts[0]].priority = i + 1;
        sortConfig[parts[0]].asc = parts[1].toUpperCase() === "ASC";
      });
      if (defaultSort.length) {
        sortTable(t, sortConfig);
      }

      const includeColumns =
        config["Include Columns"]?.split(",")?.map((s: string) => s.trim()) ||
        ([] as string[]);
      if (includeColumns.length) {
        const includeColumnIndices = includeColumns.map((s: string) =>
          ths.findIndex((th) => getKey(th) === s)
        );
        const rows = Array.from(t.getElementsByTagName("tr"));
        rows.forEach((row) => {
          const oldRow = Array.from(row.children).map((c) =>
            row.removeChild(c)
          );
          includeColumnIndices.forEach((i) => row.appendChild(oldRow[i]));
        });
      }
    });
};

runExtension("attr-tables", () => {
  observerCallback();
  createObserver(observerCallback);
});
