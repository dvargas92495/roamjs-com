import { render } from "../components/Timeline";
import { createButtonObserver, runExtension } from "../entry-helpers";

runExtension("timeline", () => {
  createButtonObserver({
    attribute: "vertical-timeline",
    shortcut: "timeline",
    render: (b: HTMLButtonElement) => {
      const blockId = b.closest(".roam-block")?.id;
      render({ p: b.parentElement, blockId });
    },
  });
});
