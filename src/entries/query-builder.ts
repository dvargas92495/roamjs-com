import ReactDOM from "react-dom";
import QueryBuilder from "../components/QueryBuilder";
import { createHTMLObserver } from "../entry-helpers";

createHTMLObserver(
  (b) => {
    if (
      b.innerText.toUpperCase() === "QUERY BUILDER" &&
      !b.getAttribute("data-query-builder")
    ) {
      b.setAttribute("data-query-builder", 'true');
      ReactDOM.render(QueryBuilder, b.parentElement);
    }
  },
  "BUTTON",
  "bp3-button"
);
