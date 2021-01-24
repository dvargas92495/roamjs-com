import format from "date-fns/format";
import { getConfigFromPage, getUids, toRoamDate } from "roam-client";
import {
  createBlockObserver,
  DAILY_NOTE_PAGE_REGEX,
  getChildRefStringsByBlockUid,
  getTextByBlockUid,
  isControl,
  replaceTagText,
  runExtension,
} from "../entry-helpers";

const onTodo = (blockUid: string) => {
  const config = getConfigFromPage("roam/js/todo-trigger");
  const text = config["Append Text"];
  if (text) {
    const formattedText = ` ${text
      .replace(new RegExp("\\^", "g"), "\\^")
      .replace(new RegExp("\\[", "g"), "\\[")
      .replace(new RegExp("\\]", "g"), "\\]")
      .replace(new RegExp("\\(", "g"), "\\(")
      .replace(new RegExp("\\)", "g"), "\\)")
      .replace(new RegExp("\\|", "g"), "\\|")
      .replace("/Current Time", "[0-2][0-9]:[0-5][0-9]")
      .replace("/Today", `\\[\\[${DAILY_NOTE_PAGE_REGEX.source}\\]\\]`)}`;
    const oldValue = getTextByBlockUid(blockUid);
    const newValue = oldValue.replace(new RegExp(formattedText), "");
    window.roamAlphaAPI.updateBlock({
      block: { string: newValue, uid: blockUid },
    });
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
    formattedPairs.forEach(([before, after]) =>
      replaceTagText({ before, after })
    );
  }
};

const onDone = (blockUid: string) => {
  const config = getConfigFromPage("roam/js/todo-trigger");
  const text = config["Append Text"];
  if (text) {
    const today = new Date();
    const formattedText = ` ${text
      .replace("/Current Time", format(today, "HH:mm"))
      .replace("/Today", `[[${toRoamDate(today)}]]`)}`;
    const oldValue = getTextByBlockUid(blockUid);
    window.roamAlphaAPI.updateBlock({
      block: { uid: blockUid, string: `${oldValue} ${formattedText}` },
    });
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
    formattedPairs.forEach(([before, after]) =>
      replaceTagText({ before, after })
    );
  }
};

runExtension("todo-trigger", () => {
  document.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" &&
      target.parentElement.className === "check-container" &&
      !target.closest(".rm-block-ref")
    ) {
      const inputTarget = target as HTMLInputElement;
      if (inputTarget.type === "checkbox") {
        const { blockUid } = getUids(
          inputTarget.closest(".roam-block") as HTMLDivElement
        );
        if (inputTarget.checked) {
          onTodo(blockUid);
        } else {
          onDone(blockUid);
        }
      }
    }
  });

  const keydownEventListener = async (e: KeyboardEvent) => {
    if (e.key === "Enter" && isControl(e)) {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") {
        const textArea = target as HTMLTextAreaElement;
        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;
        if (textArea.value.startsWith("{{[[DONE]]}}")) {
          const { blockUid } = getUids(textArea);
          onDone(blockUid);
          setTimeout(
            () =>
              (document.getElementById(
                textArea.id
              ) as HTMLTextAreaElement).setSelectionRange(start, end),
            1
          );
        } else if (!textArea.value.startsWith("{{[[TODO]]}}")) {
          const { blockUid } = getUids(textArea);
          onTodo(blockUid);
          setTimeout(
            () =>
              (document.getElementById(
                textArea.id
              ) as HTMLTextAreaElement).setSelectionRange(start, end),
            1
          );
        }
      }
    }
  };

  document.addEventListener("keydown", keydownEventListener);

  const isStrikethrough = !!getConfigFromPage("roam/js/todo-trigger")[
    "Strikethrough"
  ];

  if (isStrikethrough) {
    createBlockObserver(
      (b) => {
        const { blockUid } = getUids(b);
        if (getTextByBlockUid(blockUid).indexOf("{{[[DONE]]}}") > -1) {
          b.style.textDecoration = "line-through";
        }
      },
      (s) => {
        const parent = s.closest(".roam-block") as HTMLDivElement;
        const { blockUid } = getUids(parent);
        const refs = getChildRefStringsByBlockUid(blockUid);
        const index = Array.from(
          parent.getElementsByClassName("rm-block-ref")
        ).indexOf(s);
        if (index < refs.length && refs[index].includes("{{[[DONE]]}}")) {
          s.style.textDecoration = "line-through";
        }
      }
    );
  }
});
