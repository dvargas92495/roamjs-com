import format from "date-fns/format";
import { getConfigFromPage, getUids, toRoamDate } from "roam-client";
import {
  createBlockObserver,
  DAILY_NOTE_PAGE_REGEX,
  getChildRefStringsByBlockUid,
  getTextByBlockUid,
  isControl,
  runExtension,
} from "../entry-helpers";

const onTodo = (blockUid: string) => {
  const config = getConfigFromPage("roam/js/todo-trigger");
  const text = config["Append Text"];
  const oldValue = getTextByBlockUid(blockUid);
  let value = oldValue;
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
    value = value.replace(new RegExp(formattedText), "");
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
    formattedPairs.forEach(([before, after]) => {
      if (after) {
        value = value.replace(after, before);
      } else {
        value = `${value} #[[${after}]]`;
      }
    });
  }
  if (value !== oldValue) {
    window.roamAlphaAPI.updateBlock({
      block: { uid: blockUid, string: value },
    });
  }
};

const onDone = (blockUid: string) => {
  const config = getConfigFromPage("roam/js/todo-trigger");
  const text = config["Append Text"];
  const oldValue = getTextByBlockUid(blockUid);
  let value = oldValue;
  if (text) {
    const today = new Date();
    const formattedText = ` ${text
      .replace("/Current Time", format(today, "HH:mm"))
      .replace("/Today", `[[${toRoamDate(today)}]]`)}`;
    value = `${value}${formattedText}`;
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
    formattedPairs.forEach(([before, after]) => {
      if (after) {
        value = value.replace(before, after);
      } else {
        value = value.replace(before, "");
      }
    });
  }
  if (value !== oldValue) {
    window.roamAlphaAPI.updateBlock({
      block: { uid: blockUid, string: value },
    });
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
        setTimeout(() => {
          if (inputTarget.checked) {
            onTodo(blockUid);
          } else {
            onDone(blockUid);
          }
        }, 1);
      }
    }
  });

  const keydownEventListener = async (e: KeyboardEvent) => {
    if (e.key === "Enter" && isControl(e)) {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") {
        setTimeout(() => {
          const textArea = target as HTMLTextAreaElement;
          const { blockUid } = getUids(textArea);
          if (textArea.value.startsWith("{{[[DONE]]}}")) {
            onDone(blockUid);
          } else if (!textArea.value.startsWith("{{[[TODO]]}}")) {
            onTodo(blockUid);
          }
        }, 1);
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
