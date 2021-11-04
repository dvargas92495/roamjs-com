import {
  createMobileIcon,
  isControl,
  replaceText,
  runExtension,
  toFlexRegex,
} from "../entry-helpers";
import {
  createHTMLObserver,
  createObserver,
  getBasicTreeByParentUid,
} from "roam-client";
import { createConfigObserver, getSubTree } from "roamjs-components";

const CLASSNAMES_TO_CHECK = [
  "rm-block-ref",
  "kanban-title",
  "kanban-card",
  "roam-block",
];

runExtension("todont", () => {
  const TODONT_CLASSNAME = "roamjs-todont";
  const { pageUid } = createConfigObserver({
    title: "roam/js/todont",
    config: {
      tabs: [
        {
          id: "appearance",
          fields: [
            {
              title: "strikethrough",
              type: "flag",
              description:
                "Whether or not TODONT boxes should have strikethrough. Changing requires refresh.",
            },
          ],
        },
      ],
    },
  });
  const configTree = getBasicTreeByParentUid(pageUid);
  const appearanceTree = getSubTree({ key: "appearance", tree: configTree }).children;
  const strikethrough = appearanceTree.some((t) =>
    toFlexRegex("strikethrough").test(t.text)
  );
  const css = document.createElement("style");
  css.textContent = `.bp3-button.bp3-small.${TODONT_CLASSNAME} {
    padding: 0;
    min-height: 0;
    min-width: 0;
    top: -1px;
    left: -2px;
    height: 14px;
    border-radius: 4px;
    width: 14px;
    color: #2E2E2E;
    background-color: #EF5151;
    border: #EA666656;
    border-width: 0 2px 2px 0;
}`;
  document.getElementsByTagName("head")[0].appendChild(css);

  const styleArchivedButtons = (node: HTMLElement) => {
    const buttons = node.getElementsByTagName("button");
    Array.from(buttons).forEach((button) => {
      if (
        button.innerText === "ARCHIVED" &&
        button.className.indexOf(TODONT_CLASSNAME) < 0
      ) {
        button.innerText = "x";
        button.className = `${button.className} ${TODONT_CLASSNAME}`;
      }
    });
  };
  styleArchivedButtons(document.body);

  let previousActiveElement: HTMLElement;
  const todontIconButton = createMobileIcon(
    "mobile-todont-icon-button",
    "minus-square"
  );
  todontIconButton.onclick = () => {
    if (previousActiveElement.tagName === "TEXTAREA") {
      previousActiveElement.focus();
      todontCallback();
    }
  };

  todontIconButton.onmousedown = () => {
    previousActiveElement = document.activeElement as HTMLElement;
  };

  createObserver((mutationList: MutationRecord[]) => {
    mutationList.forEach((record) => {
      styleArchivedButtons(record.target as HTMLElement);
    });
    const mobileBackButton = document.getElementById("mobile-back-icon-button");
    if (
      !!mobileBackButton &&
      !document.getElementById("mobile-todont-icon-button")
    ) {
      const mobileBar = document.getElementById("rm-mobile-bar");
      if (mobileBar) {
        mobileBar.insertBefore(todontIconButton, mobileBackButton);
      }
    }
  });

  const todontCallback = () => {
    if (document.activeElement.tagName === "TEXTAREA") {
      const textArea = document.activeElement as HTMLTextAreaElement;
      const firstButtonTag = /{{\[\[([A-Z]{4,8})\]\]}}/.exec(
        textArea.value
      )?.[1];
      if (firstButtonTag === "TODO") {
        replaceText({ before: "{{[[TODO]]}}", after: "{{[[ARCHIVED]]}}" });
      } else if (firstButtonTag === "DONE") {
        replaceText({ before: "{{[[DONE]]}}", after: "{{[[ARCHIVED]]}}" });
      } else if (firstButtonTag === "ARCHIVED") {
        replaceText({ before: "{{[[ARCHIVED]]}}", after: "", prepend: true });
      } else {
        replaceText({ before: "", prepend: true, after: "{{[[ARCHIVED]]}}" });
      }
    }
  };

  const keydownEventListener = async (e: KeyboardEvent) => {
    if (e.key === "Enter" && e.shiftKey && isControl(e)) {
      todontCallback();
    }
  };

  document.addEventListener("keydown", keydownEventListener);

  if (strikethrough) {
    const styleBlock = (block?: HTMLElement) => {
      if (block) {
        block.style.textDecoration = "line-through";
      }
    };
    createHTMLObserver({
      callback: (b: HTMLButtonElement) => {
        const zoom = b.closest(".rm-zoom-item-content") as HTMLSpanElement;
        if (zoom) {
          styleBlock(
            zoom.firstElementChild.firstElementChild as HTMLDivElement
          );
          return;
        }
        const block = CLASSNAMES_TO_CHECK.map(
          (c) => b.closest(`.${c}`) as HTMLElement
        ).find((d) => !!d);
        if (block) {
          styleBlock(block);
        }
      },
      tag: "BUTTON",
      className: TODONT_CLASSNAME,
    });
  }
});
