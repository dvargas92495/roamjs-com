import {
  createButtonObserver,
  getTextTreeByBlockUid,
  runExtension,
} from "../entry-helpers";
import { render } from "../components/Presentation";
import { getUidsFromButton } from "roam-client";
import userEvent from "@testing-library/user-event";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.pasteEvent = userEvent.paste;

runExtension("presentation", () => {
  createButtonObserver({
    attribute: "presentation",
    shortcut: "slides",
    render: (button: HTMLButtonElement) => {
      const { blockUid } = getUidsFromButton(button);
      const { children } = getTextTreeByBlockUid(blockUid);
      render({
        button,
        getSlides: () => children,
      });
    },
  });
});
