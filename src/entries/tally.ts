import { getUidsFromButton } from "roam-client";
import { renderTallyCounter } from "../components/TallyCounter";
import { createButtonObserver, getTextTreeByBlockUid, runExtension } from "../entry-helpers";

runExtension("tally", () => {
  createButtonObserver({
    shortcut: "wiki",
    attribute: "wiki-data",
    render: (b: HTMLButtonElement) => {
      const { blockUid } = getUidsFromButton(b);
      const tree = getTextTreeByBlockUid(blockUid);
      const initialValueNode = tree.children.find(c => Number.isNaN(c));
      const initialValue = initialValueNode ? parseInt(initialValueNode.text) : 0;  
      renderTallyCounter(initialValue, b.parentElement);
    },
  });
});
