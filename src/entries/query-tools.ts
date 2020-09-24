import { createObserver, createSortIcons } from "../entry-helpers";

const observerCallback = () =>
  createSortIcons("rm-query-content", () => {}, {}, 1);

createObserver(observerCallback);
