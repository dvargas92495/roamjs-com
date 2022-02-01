import format from "date-fns/format";
import {
  createHTMLObserver,
  createTagRegex,
  DAILY_NOTE_PAGE_REGEX,
  getBlockUidFromTarget,
  getConfigFromPage,
  getTextByBlockUid,
  getUids,
  toRoamDate,
} from "roam-client";
import { isControl, runExtension } from "../entry-helpers";

const CLASSNAMES_TO_CHECK = [
  "rm-block-ref",
  "kanban-title",
  "kanban-card",
  "roam-block",
];

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
    if (pairs.length === 1) {
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
          value = value.replace(before, after);
        } else {
          value = `${value}#[[${before}]]`;
        }
      });
    }
  }

  const onTodo = config["On Todo"];
  if (onTodo) {
    const today = new Date();
    const formattedText = ` ${onTodo
      .replace("/Current Time", format(today, "HH:mm"))
      .replace("/Today", `[[${toRoamDate(today)}]]`)}`;
    value = value.includes(formattedText) ? value : `${value}${formattedText}`;
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
        .map((pp) =>
          pp === "{date}"
            ? DAILY_NOTE_PAGE_REGEX.source
            : pp === "{today}"
            ? toRoamDate()
            : pp
        )
    );
    formattedPairs.forEach(([before, after]) => {
      if (after) {
        value = value.replace(new RegExp(before), after);
      } else {
        value = value.replace(createTagRegex(before), "");
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
  createHTMLObserver({
    tag: "LABEL",
    className: "check-container",
    callback: (l: HTMLLabelElement) => {
      const inputTarget = l.querySelector("input");
      if (inputTarget.type === "checkbox") {
        const blockUid = getBlockUidFromTarget(inputTarget);
        inputTarget.addEventListener("click", () => {
          setTimeout(() => {
            const oldValue = getTextByBlockUid(blockUid);
            if (inputTarget.checked) {
              onTodo(blockUid, oldValue);
            } else {
              onDone(blockUid, oldValue);
            }
          }, 50);
        });
      }
    },
  });

  document.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;
    if (
      target.parentElement.getElementsByClassName(
        "bp3-text-overflow-ellipsis"
      )[0]?.innerHTML === "TODO"
    ) {
      const textarea = target
        .closest(".roam-block-container")
        ?.getElementsByTagName?.("textarea")?.[0];
      if (textarea) {
        const { blockUid } = getUids(textarea);
        onTodo(blockUid, textarea.value);
      }
    }
  });

  const keydownEventListener = async (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      if (isControl(e)) {
        const target = e.target as HTMLElement;
        if (target.tagName === "TEXTAREA") {
          const textArea = target as HTMLTextAreaElement;
          const { blockUid } = getUids(textArea);
          if (textArea.value.startsWith("{{[[DONE]]}}")) {
            onDone(blockUid, textArea.value);
          } else if (textArea.value.startsWith("{{[[TODO]]}}")) {
            onTodo(blockUid, textArea.value);
          }
          return;
        }
        Array.from(document.getElementsByClassName("block-highlight-blue"))
          .map(
            (d) => d.getElementsByClassName("roam-block")[0] as HTMLDivElement
          )
          .map((d) => getUids(d).blockUid)
          .map((blockUid) => ({ blockUid, text: getTextByBlockUid(blockUid) }))
          .forEach(({ blockUid, text }) => {
            if (text.startsWith("{{[[DONE]]}}")) {
              onTodo(blockUid, text);
            } else if (text.startsWith("{{[[TODO]]}}")) {
              onDone(blockUid, text);
            }
          });
      } else {
        const target = e.target as HTMLElement;
        if (target.tagName === "TEXTAREA") {
          const todoItem = Array.from(
            target.parentElement.querySelectorAll<HTMLDivElement>(
              ".bp3-text-overflow-ellipsis"
            )
          ).find((t) => t.innerText === "TODO");
          if (
            todoItem &&
            getComputedStyle(todoItem.parentElement).backgroundColor ===
              "rgb(213, 218, 223)"
          ) {
            const textArea = target as HTMLTextAreaElement;
            const { blockUid } = getUids(textArea);
            onTodo(blockUid, textArea.value);
          }
        }
      }
    }
  };

  document.addEventListener("keydown", keydownEventListener);

  const config = getConfigFromPage("roam/js/todo-trigger");
  const isStrikethrough = !!config["Strikethrough"];
  const isClassname = !!config["Classname"];
  const styleBlock = (block: HTMLElement) => {
    if (isStrikethrough) {
      block.style.textDecoration = "line-through";
    }
    if (isClassname) {
      block.classList.add("roamjs-done");
    }
  };
  const unstyleBlock = (block: HTMLElement) => {
    block.style.textDecoration = "none";
    block.classList.remove("roamjs-done");
  };

  if (isStrikethrough || isClassname) {
    createHTMLObserver({
      callback: (l: HTMLLabelElement) => {
        const input = l.getElementsByTagName("input")[0];
        if (input.checked && !input.disabled) {
          const zoom = l.closest(".rm-zoom-item-content") as HTMLSpanElement;
          if (zoom) {
            styleBlock(
              zoom.firstElementChild.firstElementChild as HTMLDivElement
            );
            return;
          }
          const block = CLASSNAMES_TO_CHECK.map(
            (c) => l.closest(`.${c}`) as HTMLElement
          ).find((d) => !!d);
          if (block) {
            styleBlock(block);
          }
        } else {
          const zoom = l.closest(".rm-zoom-item-content") as HTMLSpanElement;
          if (zoom) {
            unstyleBlock(
              zoom.firstElementChild.firstElementChild as HTMLDivElement
            );
            return;
          }
          const block = CLASSNAMES_TO_CHECK.map(
            (c) => l.closest(`.${c}`) as HTMLElement
          ).find((d) => !!d);
          if (block) {
            unstyleBlock(block);
          }
        }
      },
      tag: "LABEL",
      className: "check-container",
    });
  }
});
