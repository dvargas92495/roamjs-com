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
      if (value.startsWith("{{[[TODO]]}}") || value.startsWith("{{[[DONE]]}}")) {
          textArea.setSelectionRange(4, 8);
          userEvent.clear(textArea);
          userEvent.type(textArea, "ARCHIVED");
      } else if (value.startsWith("{{[[ARCHIVED]]}}")) {
          textArea.setSelectionRange(0, 16);
          userEvent.clear(textArea);
      } else {
        textArea.setSelectionRange(0, 1);
        userEvent.type(textArea, "{{[[ARCHIVED]]}}")
    }
  }
};

document.addEventListener("keydown", keydownEventListener);
