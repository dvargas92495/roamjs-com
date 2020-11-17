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
    renderQueryBuilder({
      blockId: b.closest(".roam-block").id,
      parent: b.parentElement,
    }),
});

const dataAttribute = "data-roamjs-edit-query";

createHTMLObserver(
  (b) => {
    if (!b.getAttribute(dataAttribute)) {
      b.setAttribute(dataAttribute, "true");
      const editButtonRoot = document.createElement("div");
      b.appendChild(editButtonRoot);
      const blockId = b.closest(".roam-block").id;
      renderQueryBuilder({
        blockId,
        parent: editButtonRoot,
        initialValue: b.textContent,
      });
      const editButton = document
        .getElementById(`roamjs-query-builder-button-${blockId}`);
      editButton.addEventListener("mousedown", (e) => e.stopPropagation());
      editButton.style.float = 'right';
    }
  },
  "DIV",
  "rm-query-title"
);
