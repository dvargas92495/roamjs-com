import format from "date-fns/format";
import {
  asyncType,
  getConfigFromPage,
  openBlock,
  toRoamDate,
} from "roam-client";

const onTodo = async () => {
  const config = getConfigFromPage("roam/js/todo-trigger");
  const text = config["Append Text"] || "";
  const formattedText = ` ${text
    .replace("/Current Time", "[0-2][0-9]:[0-5][0-9]")
    .replace(
      "/Today",
      "\\[\\[(January|February|March|April|May|June|July|August|September|October|November|December) [0-3]?[0-9](st|nd|rd|th), [0-9][0-9][0-9][0-9]\\]\\]"
    )}`;
  const textarea = document.activeElement as HTMLTextAreaElement;
  const value = textarea.value;
  const results = new RegExp(formattedText).exec(value);
  if (results[0]) {
    const len = results[0].length;
    textarea.setSelectionRange(results.index, results.index + len);
    await asyncType("{backspace}");
  }
};

const onDone = async () => {
  const textArea = document.activeElement as HTMLTextAreaElement;
  textArea.setSelectionRange(textArea.value.length, textArea.value.length);
  const config = getConfigFromPage("roam/js/todo-trigger");
  const text = config["Append Text"] || "";
  const today = new Date();
  const formattedText = ` ${text
    .replace("/Current Time", format(today, "HH:mm"))
    .replace("/Today", `[[${toRoamDate(today)}]]`)}`;
  await asyncType(formattedText);
};

document.addEventListener("click", async (e) => {
  const target = e.target as HTMLElement;
  if (
    target.tagName === "INPUT" &&
    target.parentElement.className === "check-container"
  ) {
    const inputTarget = target as HTMLInputElement;
    if (inputTarget.type === "checkbox") {
      await openBlock(inputTarget.closest(".roam-block"));
      if (inputTarget.checked) {
        onTodo();
      } else {
        await onDone();
      }
      document.body.click();
    }
  }
});
