import createButtonObserver from "roamjs-components/dom/createButtonObserver";
import getUidsFromButton from "roamjs-components/dom/getUidsFromButton";
import runExtension from "roamjs-components/util/runExtension";
import { render } from "../components/Repl";

runExtension("repl", () => {
  createButtonObserver({
    shortcut: "repl",
    attribute: "repl-editor",
    render: (b: HTMLButtonElement) => {
      const { blockUid } = getUidsFromButton(b);
      b.parentElement.onmousedown = (e: MouseEvent) => e.stopPropagation();
      render({ blockUid, p: b.parentElement });
    },
  });
});
