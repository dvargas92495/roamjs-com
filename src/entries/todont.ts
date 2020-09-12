import userEvent from "@testing-library/user-event";
import { asyncType } from "../entry-helpers";

const styleArchivedButtons = (node: HTMLElement) => {
  const buttons = node.getElementsByTagName("button");
  Array.from(buttons).forEach((button) => {
    if (button.innerText === "ARCHIVED") {
      button.style.cssText = "background-color:red !important";
      button.innerText = "x";
      button.style.borderRadius = "0";
      button.style.padding = "0";
      button.style.minHeight = "0";
      button.style.minWidth = "0";
      button.style.height = "16px";
    }
  });
};
styleArchivedButtons(document.body);

const mutationConfig = { childList: true, subtree: true };
const mutationTarget = document.getElementsByClassName("roam-article")[0];
const mutationCallback = (mutationList: MutationRecord[]) => {
  mutationList.forEach((record) => {
    styleArchivedButtons(record.target as HTMLElement);
  });
};
const observer = new MutationObserver(mutationCallback);
observer.observe(mutationTarget, mutationConfig);

const resetCursor = (inputStart: number, inputEnd: number) => {
  const textArea = document.activeElement as HTMLTextAreaElement;
  const start = Math.max(0, inputStart);
  const end = Math.max(0, inputEnd);

  // hack to reset cursor in original location
  setTimeout(() => textArea.setSelectionRange(start, end), 50);
};

const keydownEventListener = async (e: KeyboardEvent) => {
  if (
    e.key === "Enter" &&
    e.shiftKey &&
    e.ctrlKey &&
    document.activeElement.tagName === "TEXTAREA"
  ) {
    const textArea = document.activeElement as HTMLTextAreaElement;
    const value = textArea.value;
    const oldStart = textArea.selectionStart;
    const oldEnd = textArea.selectionEnd;
    if (value.startsWith("{{[[TODO]]}}") || value.startsWith("{{[[DONE]]}}")) {
      textArea.setSelectionRange(4, 8);
      await asyncType("{backspace}");
      await asyncType("ARCHIVED");
      resetCursor(oldStart + 4, oldEnd + 4);
    } else if (value.startsWith("{{[[ARCHIVED]]}}")) {
      const afterArchive = value.substring(16).trim();
      const end = value.indexOf(afterArchive);
      textArea.setSelectionRange(0, end);
      await asyncType("{backspace}");
      resetCursor(oldStart - end, oldEnd - end);
    } else {
      textArea.setSelectionRange(0, 0);
      await userEvent.type(textArea, "{{[[ARCHIVED]]}} ", {
        initialSelectionStart: 0,
        initialSelectionEnd: 0,
      });
      resetCursor(oldStart + 17, oldEnd + 17);
    }
  }
};

document.addEventListener("keydown", keydownEventListener);
