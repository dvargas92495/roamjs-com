import ReactDOM from "react-dom";
import renderQueryBuilder from "../components/QueryBuilder";
import { createHTMLObserver } from "../entry-helpers";

const css = document.createElement("style");
css.textContent = `.bp3-button:focus {
    outline-width: 2px;
}`;
document.getElementsByTagName("head")[0].appendChild(css);

createHTMLObserver(
  (b) => {
    if (
      b.innerText.toUpperCase() === "QUERY BUILDER" ||
      b.innerText.toUpperCase() === "QB"
    ) {
      if (!b.getAttribute("data-query-builder")) {
        b.setAttribute("data-query-builder", "true");
        ReactDOM.render(
          renderQueryBuilder(b.closest(".roam-block").id),
          b.parentElement
        );
      }
    }
  },
  "BUTTON",
  "bp3-button"
);
