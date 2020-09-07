import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/dom";

const waitForCallback = (text: string) => () => {
  const textArea = document.activeElement as HTMLTextAreaElement;
  if (textArea.value.toUpperCase() !== text.toUpperCase()) {
    throw new Error("Typing not complete");
  }
};

const clickEventListener = (
  targetCommand: string,
  callback: () => void
) => async (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (
    target &&
    target.tagName === "BUTTON" &&
    target.innerText.toUpperCase() === targetCommand.toUpperCase()
  ) {
    const divContainer = target.parentElement.parentElement
      .parentElement as HTMLDivElement;
    await userEvent.click(divContainer);
    await waitFor(waitForCallback(`{{${targetCommand}}}`));
    const textArea = document.activeElement as HTMLTextAreaElement;
    await userEvent.clear(textArea);
    await waitFor(waitForCallback(""));
    callback();
  }
};

export const addButtonListener = (
  targetCommand: string,
  callback: () => void
) => {
  const listener = clickEventListener(targetCommand, callback);
  document.addEventListener("click", listener);
};
