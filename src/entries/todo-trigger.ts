import format from "date-fns/format";
import {
  asyncType,
  getConfigFromPage,
  getUids,
  openBlock,
  toRoamDate,
} from "roam-client";
import { createBlockObserver, getTextByBlockUid } from "../entry-helpers";

const replaceText = async ([before, after]: string[]) => {
  const textArea = document.activeElement as HTMLTextAreaElement;
  const index = textArea.value.indexOf(before);
  if (index > 0) {
    textArea.setSelectionRange(index, index + before.length);
    await asyncType(`{backspace}${after}`);
  }
};

const replaceTagText = async ([before, after]: string[]) => {
  await replaceText([`#[[${before}]]`, `#[[${after}]]`]);
  await replaceText([`[[${before}]]`, `[[${after}]]`]);
  await replaceText([`#${before}`, `#${after}`]);
};

const onTodo = async () => {
  const config = getConfigFromPage("roam/js/todo-trigger");
  const text = config["Append Text"];
  if (text) {
    const formattedText = ` ${text
      .replace("/Current Time", "[0-2][0-9]:[0-5][0-9]")
      .replace(
        "/Today",
        "\\[\\[(January|February|March|April|May|June|July|August|September|October|November|December) [0-3]?[0-9](st|nd|rd|th), [0-9][0-9][0-9][0-9]\\]\\]"
      )}`;
    const textarea = document.activeElement as HTMLTextAreaElement;
    const value = textarea.value;
    const results = new RegExp(formattedText).exec(value);
    if (results) {
      const len = results[0].length;
      textarea.setSelectionRange(results.index, results.index + len);
      await asyncType("{backspace}");
    }
  }
  const replaceTags = config["Replace Tags"];
  if (replaceTags) {
    const pairs = replaceTags.split("|") as string[];
    const formattedPairs = pairs.map((p) =>
      p
        .split(",")
        .map((pp) =>
          pp.trim().replace("#", "").replace("[[", "").replace("]]", "")
        )
        .reverse()
    );
    formattedPairs.forEach(replaceTagText);
  }
};

const onDone = async () => {
  const config = getConfigFromPage("roam/js/todo-trigger");
  const text = config["Append Text"];
  if (text) {
    const textArea = document.activeElement as HTMLTextAreaElement;
    textArea.setSelectionRange(textArea.value.length, textArea.value.length);
    const today = new Date();
    const formattedText = ` ${text
      .replace("/Current Time", format(today, "HH:mm"))
      .replace("/Today", `[[${toRoamDate(today)}]]`)}`;
    await asyncType(formattedText);
  }
  const replaceTags = config["Replace Tags"];
  if (replaceTags) {
    const pairs = replaceTags.split("|") as string[];
    const formattedPairs = pairs.map((p) =>
      p
        .split(",")
        .map((pp) =>
          pp.trim().replace("#", "").replace("[[", "").replace("]]", "")
        )
    );
    formattedPairs.forEach(replaceTagText);
  }
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

const keydownEventListener = async (e: KeyboardEvent) => {
  if (e.key === "Enter" && e.ctrlKey) {
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA") {
      const textArea = target as HTMLTextAreaElement;
      if (textArea.value.startsWith("{{[[DONE]]}}")) {
        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;
        await onDone();
        textArea.setSelectionRange(start, end);
      } else if (!textArea.value.startsWith("{{[[TODO]]}}")) {
        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;
        await onTodo();
        textArea.setSelectionRange(start, end);
      }
    }
  }
};

document.addEventListener("keydown", keydownEventListener);

const isStrikethrough = !!getConfigFromPage("roam/js/todo-trigger")[
  "Strikethrough"
];

createBlockObserver((b) => {
  if (isStrikethrough) {
    const { blockUid } = getUids(b);
    if (getTextByBlockUid(blockUid).indexOf("{{[[DONE]]}}") > -1) {
      b.style.textDecoration = "line-through";
    }
  }
});
