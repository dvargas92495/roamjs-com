import {
  renderBarChart,
  renderLineChart,
  styleContent,
} from "../components/Charts";
import runExtension from "roamjs-components/util/runExtension";
import addStyle from "roamjs-components/dom/addStyle";
import createButtonObserver from "roamjs-components/dom/createButtonObserver";

runExtension({
  extensionId: "charts",
  migratedTo: "Query Builder",
  run: () => {
    addStyle(styleContent);

    createButtonObserver({
      shortcut: "line",
      attribute: "line-chart",
      render: (b: HTMLButtonElement) =>
        renderLineChart({
          blockId: b.closest(".roam-block").id,
          parent: b.parentElement,
        }),
    });

    createButtonObserver({
      shortcut: "bar",
      attribute: "bar-chart",
      render: (b: HTMLButtonElement) =>
        renderBarChart({
          blockId: b.closest(".roam-block").id,
          parent: b.parentElement,
        }),
    });
  },
});
