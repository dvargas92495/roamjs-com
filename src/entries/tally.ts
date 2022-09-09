import createButtonObserver from "roamjs-components/dom/createButtonObserver";
import getUidsFromButton from "roamjs-components/dom/getUidsFromButton";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import runExtension from "roamjs-components/util/runExtension";
import { renderTallyCounter } from "../components/TallyCounter";

runExtension("tally", () => {
  createButtonObserver({
    shortcut: "tally",
    attribute: "tally-button",
    render: (b: HTMLButtonElement) => {
      const { blockUid } = getUidsFromButton(b);
      const tree = getFullTreeByParentUid(blockUid);
      const initialValueNode = tree.children.find(
        (c) => !isNaN(parseInt(c.text))
      );
      const initialValue = initialValueNode
        ? parseInt(initialValueNode.text)
        : 0;
      renderTallyCounter(initialValue, b.parentElement);
    },
  });
});
