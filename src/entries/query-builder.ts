import { renderQueryBuilder } from "../components/QueryBuilder";
import { createButtonObserver } from "../entry-helpers";

const css = document.createElement("style");
css.textContent = `.bp3-button:focus {
    outline-width: 2px;
}`;
document.getElementsByTagName("head")[0].appendChild(css);

createButtonObserver({
  shortcut: "qb",
  attribute: "query-builder",
  render: (b: HTMLButtonElement) =>
    renderQueryBuilder(b.closest(".roam-block").id, b.parentElement),
});
