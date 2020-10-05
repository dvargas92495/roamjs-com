import { createObserver, createSortIcons } from "../entry-helpers";

const observerCallback = () =>
  createSortIcons(
    () =>
      Array.from(document.getElementsByClassName("roam-table")).map(
        (d) => d.getElementsByTagName("th")[0]
      ),
    () => {},
    {}
  );
observerCallback();
createObserver(observerCallback);
