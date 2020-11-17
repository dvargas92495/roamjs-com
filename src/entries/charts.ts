import {
  CHARTS_WRAPPER,
  renderBarChart,
  renderLineChart,
} from "../components/Charts";
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
