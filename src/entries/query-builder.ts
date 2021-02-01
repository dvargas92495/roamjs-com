import { getTextByBlockUid, getUidsFromId } from "roam-client";
import { renderQueryBuilder } from "../components/QueryBuilder";
import {
  createButtonObserver,
  createHTMLObserver,
  runExtension,
} from "../entry-helpers";

runExtension("query-builder", () => {
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

  createHTMLObserver({
    callback: (b) => {
      if (!b.getAttribute(dataAttribute)) {
        b.setAttribute(dataAttribute, "true");
        const editButtonRoot = document.createElement("div");
        b.appendChild(editButtonRoot);
        const blockId = b.closest(".roam-block").id;
        const initialValue = getTextByBlockUid(getUidsFromId(blockId).blockUid);
        renderQueryBuilder({
          blockId,
          parent: editButtonRoot,
          initialValue,
        });
        const editButton = document.getElementById(
          `roamjs-query-builder-button-${blockId}`
        );
        editButton.addEventListener("mousedown", (e) => e.stopPropagation());
      }
    },
    tag: "DIV",
    className: "rm-query-title",
  });
});
