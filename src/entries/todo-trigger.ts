import format from "date-fns/format";
import {
  createHTMLObserver,
  getConfigFromPage,
  getNthChildUidByBlockUid,
  getTextByBlockUid,
  getUids,
  toRoamDate,
} from "roam-client";
import {
  createTagRegex,
  DAILY_NOTE_PAGE_REGEX,
  getReferenceBlockUid,
  isControl,
  runExtension,
} from "../entry-helpers";

const CLASSNAMES_TO_CHECK = [
  "rm-block-ref",
  "kanban-title",
  "kanban-card",
  "roam-block",
];

const getBlockUidFromTarget = (target: HTMLElement) => {
  const ref = target.closest(".rm-block-ref") as HTMLSpanElement;
  if (ref) {
    return getReferenceBlockUid(ref);
  }
  const { blockUid } = getUids(target.closest(".roam-block") as HTMLDivElement);
  const kanbanTitle = target.closest(".kanban-title");
  if (kanbanTitle) {
    const container = kanbanTitle.closest(".kanban-column-container");
    const column = kanbanTitle.closest(".kanban-column");
    const order = Array.from(container.children).findIndex((d) => d === column);
    return getNthChildUidByBlockUid({ blockUid, order });
  }
  const kanbanCard = target.closest(".kanban-card");
  if (kanbanCard) {
    const container = kanbanCard.closest(".kanban-column-container");
    const column = kanbanCard.closest(".kanban-column");
    const order = Array.from(container.children).findIndex((d) => d === column);
    const titleUid = getNthChildUidByBlockUid({ blockUid, order });
    const nestedOrder =
      Array.from(column.children).findIndex((d) => d === kanbanCard) - 1;
    return getNthChildUidByBlockUid({ blockUid: titleUid, order: nestedOrder });
  }
  return blockUid;
};

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
        value = value.replace(before, after);
      } else {
        value = `${value}#[[${before}]]`;
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
  document.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" &&
      target.parentElement.className === "check-container"
    ) {
      const inputTarget = target as HTMLInputElement;
      if (inputTarget.type === "checkbox") {
        const blockUid = getBlockUidFromTarget(inputTarget);
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
        return;
      }
      Array.from(document.getElementsByClassName("block-highlight-blue"))
        .map((d) => d.getElementsByClassName("roam-block")[0] as HTMLDivElement)
        .map((d) => getUids(d).blockUid)
        .map((blockUid) => ({ blockUid, text: getTextByBlockUid(blockUid) }))
        .forEach(({ blockUid, text }) => {
          if (text.startsWith("{{[[DONE]]}}")) {
            onTodo(blockUid, text);
          } else if (text.startsWith("{{[[TODO]]}}")) {
            onDone(blockUid, text);
          }
        });
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
        if (input.checked && !input.disabled) {
          const zoom = l.closest(".rm-zoom-item-content") as HTMLSpanElement;
          if (zoom) {
            (zoom.firstElementChild
              .firstElementChild as HTMLDivElement).style.textDecoration =
              "line-through";
            return;
          }
          const block = CLASSNAMES_TO_CHECK.map(
            (c) => l.closest(`.${c}`) as HTMLElement
          ).find((d) => !!d);
          if (block) {
            block.style.textDecoration = "line-through";
          }
        } else {
          const zoom = l.closest(".rm-zoom-item-content") as HTMLSpanElement;
          if (zoom) {
            (zoom.firstElementChild
              .firstElementChild as HTMLDivElement).style.textDecoration =
              "none";
            return;
          }
          const block = CLASSNAMES_TO_CHECK.map(
            (c) => l.closest(`.${c}`) as HTMLElement
          ).find((d) => !!d);
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
