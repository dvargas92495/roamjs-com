import {
  createButtonObserver,
  getTextTreeByBlockUid,
  runExtension,
} from "../entry-helpers";
import { render } from "../components/Presentation";
import { getUidsFromButton } from "roam-client";

runExtension("presentation", () => {
  createButtonObserver({
    attribute: "presentation",
    shortcut: "slides",
    render: (button: HTMLButtonElement) => {
      const { blockUid } = getUidsFromButton(button);
      const { children } = getTextTreeByBlockUid(blockUid);
      render({
        button,
        getMarkdown: () => {
          return children.map(t => t.children.map(c => c.text).join('\n\n'));
        },
      }),
    }
  });
});
