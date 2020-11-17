import { getUids } from "roam-client";
import { CHARTS_WRAPPER, renderBarChart, renderLineChart } from "../components/Charts";
import { addStyle, createButtonObserver } from "../entry-helpers";

addStyle(`.${CHARTS_WRAPPER} {
    height: 300px;
    width: 400px;
}`);

createButtonObserver({
  shortcut: "line",
  attribute: "line-chart",
  render: (b: HTMLButtonElement) =>
    renderLineChart({
      blockUid: getUids(b.closest(".roam-block") as HTMLDivElement).blockUid,
      parent: b.parentElement,
    }),
});

createButtonObserver({
  shortcut: "bar",
  attribute: "bar-chart",
  render: (b: HTMLButtonElement) =>
    renderBarChart({
      blockUid: getUids(b.closest(".roam-block") as HTMLDivElement).blockUid,
      parent: b.parentElement,
    }),
});
