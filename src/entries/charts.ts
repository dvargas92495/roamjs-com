import {
  renderBarChart,
  renderLineChart,
  styleContent,
} from "../components/Charts";
import { addStyle, runExtension } from "../entry-helpers";
import { createButtonObserver } from "roam-client";

runExtension("charts", () => {
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
});
