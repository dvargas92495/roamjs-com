import format from "date-fns/format";
import {
  asyncType,
  getConfigFromPage,
  openBlock,
  toRoamDate,
} from "roam-client";

const onTodo = () => {
  const config = getConfigFromPage("roam/js/todo-trigger");
  const text = config["Append Text"] || "";
  const formattedText = text
    .replace("/Current Time", "[0-1][0-9]:[0-5][0-9]")
    .replace(
      "/Today",
      "\\[\\[(January|February|March|April|May|June|July|August|September|October|November|December) [0-3]?[0-9](st|nd|rd|th), [0-9][0-9][0-9][0-9]\\]\\]"
    );
  const value = (document.activeElement as HTMLTextAreaElement).value;
  const results = new RegExp(value).exec(value);
  console.log(results, value, formattedText);
};

const onDone = async () => {
  const textArea = document.activeElement as HTMLTextAreaElement;
  textArea.setSelectionRange(textArea.value.length, textArea.value.length);
  const config = getConfigFromPage("roam/js/todo-trigger");
  const text = config["Append Text"] || "";
  const today = new Date();
  const formattedText = text
    .replace("/Current Time", format(today, "hh:mm"))
    .replace("/Today", `[[${toRoamDate(today)}]]`);
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
