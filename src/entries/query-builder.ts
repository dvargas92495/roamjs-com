import { renderQueryBuilder } from "../components/QueryBuilder";
import { createButtonObserver, createHTMLObserver } from "../entry-helpers";

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

const dataAttribute = 'data-roamjs-edit-query';

createHTMLObserver(
  (b) => {
    if (!b.getAttribute(dataAttribute)) {
      b.setAttribute(dataAttribute, 'true');
      const editButtonRoot = document.createElement('div');
      b.appendChild(editButtonRoot);
      console.log(b.textContent);
      renderQueryBuilder(b.closest('.roam-block').id, editButtonRoot);
    }
  },
  "DIV",
  "rm-query-title"
);