import userEvent from "@testing-library/user-event";

const keydownEventListener = (e: KeyboardEvent) => {
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
          userEvent.type(textArea, "{backspace}");
          userEvent.type(textArea, "ARCHIVED");
          textArea.setSelectionRange(oldStart + 4, oldEnd + 4);
      } else if (value.startsWith("\{\{\[\[ARCHIVED\]\]\}\}")) {
          textArea.setSelectionRange(0, 16);
          userEvent.type(textArea, "{backspace}");
          textArea.setSelectionRange(oldStart -16, oldEnd -16);
      } else {
        textArea.setSelectionRange(0, 1);
        userEvent.type(textArea, "\{\{\[\[ARCHIVED\]\]\}\}")
        textArea.setSelectionRange(oldStart + 16, oldEnd + 16);
    }
  }
};

document.addEventListener("keydown", keydownEventListener);
