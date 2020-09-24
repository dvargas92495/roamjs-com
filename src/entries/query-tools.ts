import { createObserver, createSortIcons } from "../entry-helpers";

const observerCallback = () =>
  createSortIcons("rm-query-content", () => {}, {});

createObserver(observerCallback);
