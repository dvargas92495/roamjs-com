import format from "date-fns/format";
import { asyncType, getConfigFromPage, openBlock, toRoamDate } from "roam-client";

const onTodo = () => {
    console.log("TODO!");
}

const onDone = async () => {
    const config = getConfigFromPage("roam/js/todo-trigger");
    const text = config["Append Text"] || "";
    const today = new Date();
    const formattedText = text.replace("/Current Time", format(today, "hh:mm")).replace("/Today", `[[${toRoamDate(today)}]]`)
    await asyncType(formattedText);
}

document.addEventListener("click", async (e) => {
  const target = e.target as HTMLElement;
  if (
    target.tagName === "INPUT" &&
    target.parentElement.className === "check-container"
  ) {
    const inputTarget = target as HTMLInputElement;
    if (inputTarget.type === "checkbox") {
        if (inputTarget.checked) {
            onTodo();
        } else {
            await openBlock(inputTarget.closest('.roam-block'));
            await onDone();
        }
    }
  }
});
