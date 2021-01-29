import format from "date-fns/format";
import { getConfigFromPage, getUids, toRoamDate } from "roam-client";
import {
  createHTMLObserver,
  DAILY_NOTE_PAGE_REGEX,
  getTextByBlockUid,
  isControl,
  runExtension,
} from "../entry-helpers";

const onTodo = (blockUid: string, oldValue: string) => {
  const config = getConfigFromPage("roam/js/todo-trigger");
  const text = config["Append Text"];
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

const onDone = (blockUid: string, oldValue: string) => {
  const config = getConfigFromPage("roam/js/todo-trigger");
  const text = config["Append Text"];
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
          const oldValue = getTextByBlockUid(blockUid);
          if (inputTarget.checked) {
            onTodo(blockUid, oldValue);
          } else {
            onDone(blockUid, oldValue);
          }
        }, 50);
      }
    }
  });

  const keydownEventListener = async (e: KeyboardEvent) => {
    if (e.key === "Enter" && isControl(e)) {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") {
        const textArea = target as HTMLTextAreaElement;
        const { blockUid } = getUids(textArea);
        if (textArea.value.startsWith("{{[[DONE]]}}")) {
          onDone(blockUid, textArea.value);
        } else if (!textArea.value.startsWith("{{[[TODO]]}}")) {
          onTodo(blockUid, textArea.value);
        }
      }
    }
  };

  document.addEventListener("keydown", keydownEventListener);

  const isStrikethrough = !!getConfigFromPage("roam/js/todo-trigger")[
    "Strikethrough"
  ];

  if (isStrikethrough) {
    createHTMLObserver({
      callback: (l: HTMLLabelElement) => {
        const input = l.getElementsByTagName("input")[0];
        if (input.checked) {
          const ref = l.closest(".rm-block-ref") as HTMLSpanElement;
          if (ref) {
            ref.style.textDecoration = "line-through";
            return;
          }
          const zoom = l.closest(".rm-zoom-item-content") as HTMLSpanElement;
          if (zoom) {
            (zoom.firstElementChild
              .firstElementChild as HTMLDivElement).style.textDecoration =
              "line-through";
            return;
          }
          const block = l.closest(".roam-block") as HTMLDivElement;
          if (block) {
            block.style.textDecoration = "line-through";
          }
        } else {
          const ref = l.closest(".rm-block-ref") as HTMLSpanElement;
          if (ref) {
            ref.style.textDecoration = "none";
            return;
          }
          const zoom = l.closest(".rm-zoom-item-content") as HTMLSpanElement;
          if (zoom) {
            (zoom.firstElementChild
              .firstElementChild as HTMLDivElement).style.textDecoration =
              "none";
            return;
          }
          const block = l.closest(".roam-block") as HTMLDivElement;
          if (block) {
            block.style.textDecoration = "none";
          }
        }
      },
      tag: "LABEL",
      className: "check-container",
    });
  }
});
