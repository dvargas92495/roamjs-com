import { getUidsFromButton } from "roam-client";
import { renderTallyCounter } from "../components/TallyCounter";
import {
  createButtonObserver,
  getTextTreeByBlockUid,
  runExtension,
} from "../entry-helpers";

runExtension({
  extensionId: "tally",
  run: () => {
    createButtonObserver({
      shortcut: "tally",
      attribute: "tally-button",
      render: (b: HTMLButtonElement) => {
        const { blockUid } = getUidsFromButton(b);
        const tree = getTextTreeByBlockUid(blockUid);
        const initialValueNode = tree.children.find(
          (c) => !Number.isNaN(c.text)
        );
        const initialValue = initialValueNode
          ? parseInt(initialValueNode.text)
          : 0;
        renderTallyCounter(initialValue, b.parentElement);
      },
    });
  },
});
