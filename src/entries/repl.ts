import { getUidsFromButton } from "roam-client";
import { render } from "../components/Repl";
import { createButtonObserver, runExtension } from "../entry-helpers";

runExtension("repl", () => {
  createButtonObserver({
    shortcut: "repl",
    attribute: "repl-editor",
    render: (b: HTMLButtonElement) => {
      const { blockUid } = getUidsFromButton(b);
      render({ blockUid, p: b.parentElement });
    },
  });
});
