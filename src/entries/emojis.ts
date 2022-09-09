import emoji from "node-emoji";
import getUids from "roamjs-components/dom/getUids";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import runExtension from "roamjs-components/util/runExtension";

runExtension("emojis", () => {
  const config = Object.fromEntries(
    getFullTreeByParentUid(getPageUidByPageTitle("roam/js/emojis"))
      .children.map((s) => s.text.split("::"))
      .filter((c) => c.length === 2)
  );
  const minimumCharacters = config["Minimum Characters"]
    ? parseInt(config["Minimum Characters"])
    : 2;

  const HIGHLIGHTED_COLOR = "#0000001c";

  let searchText = "";
  let emojiOn = false;
  let menuItemIndex = 0;
  let results: emoji.Emoji[] = [];
  let currentTarget: HTMLTextAreaElement = document.createElement("textarea");

  // The following styling is ripped from Roam's menu style
  const menu = document.createElement("div");
  menu.className = "bp3-elevation-3";
  menu.style.maxHeight = "300px";
  menu.style.top = "26px";
  menu.style.overflow = "auto";
  menu.style.backgroundColor = "white";
  menu.style.width = "400px";
  menu.style.maxWidth = "400px";
  menu.style.zIndex = "10";
  menu.style.padding = "4px";
  menu.style.position = "absolute";
  menu.style.marginRight = "24px";
  menu.style.marginBottom = "24px";
  menu.style.left = "10px";

  const clearMenu = () => {
    while (menu.lastChild) {
      menu.removeChild(menu.lastChild);
    }
  };

  const turnOnEmoji = () => {
    currentTarget = document.activeElement as HTMLTextAreaElement;
    currentTarget.addEventListener("keydown", emojiKeyDownListener);

    emojiOn = true;
    searchText = ":";
    menuItemIndex = 0;
    searchEmojis(searchText);
  };

  const turnOffEmoji = () => {
    if (emojiOn) {
      menu.remove();
      emojiOn = false;
    }
    searchText = "";
    currentTarget.removeEventListener("keydown", emojiKeyDownListener);
  };

  const insertEmoji = (target: HTMLTextAreaElement, emojiCode: string) => {
    const initialValue = target.value;
    window.roamAlphaAPI.updateBlock({
      block: {
        uid: getUids(menu.parentElement.getElementsByTagName("textarea")[0])
          .blockUid,
        string: initialValue.replace(searchText, emojiCode),
      },
    });
    turnOffEmoji();
  };

  const createMenuElement =
    (size: number) =>
    ({ emoji, key }: emoji.Emoji, i: number) => {
      const title = `${key} ${emoji}`;
      const container = document.createElement("div");
      container.title = title;
      container.className = "dont-unfocus-block";
      container.style.borderRadius = "2px";
      container.style.padding = "6px";
      container.style.cursor = "pointer";
      if (i % size === menuItemIndex) {
        container.style.backgroundColor = HIGHLIGHTED_COLOR;
      }

      const result = document.createElement("div");
      result.className = "rm-autocomplete-result";
      result.innerText = title;

      const target = document.activeElement as HTMLTextAreaElement;
      result.onclick = () => insertEmoji(target, emoji);
      container.appendChild(result);

      menu.appendChild(container);
    };

  const emojiKeyDownListener = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      if (results.length === 0) {
        turnOffEmoji();
      } else {
        insertEmoji(
          e.target as HTMLTextAreaElement,
          results[menuItemIndex].emoji
        );
        e.preventDefault();
        e.stopPropagation();
      }
    } else if (e.key === "ArrowDown") {
      if (results.length > 0) {
        const oldElement = menu.children[menuItemIndex] as HTMLDivElement;
        oldElement.style.backgroundColor = "";
        menuItemIndex = (menuItemIndex + 1) % results.length;
        const newElement = menu.children[menuItemIndex] as HTMLDivElement;
        newElement.style.backgroundColor = HIGHLIGHTED_COLOR;
      }
      e.preventDefault();
      e.stopPropagation();
    } else if (e.key === "ArrowUp") {
      if (results.length > 0) {
        const oldElement = menu.children[menuItemIndex] as HTMLDivElement;
        oldElement.style.backgroundColor = "";
        menuItemIndex = (menuItemIndex - 1 + results.length) % results.length;
        const newElement = menu.children[menuItemIndex] as HTMLDivElement;
        newElement.style.backgroundColor = HIGHLIGHTED_COLOR;
      }
      e.preventDefault();
      e.stopPropagation();
    } else if (e.key === "Escape" && emojiOn) {
      turnOffEmoji();
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const searchEmojis = (text: string) => {
    const parentDiv = currentTarget.parentElement as HTMLDivElement;
    if (!parentDiv) {
      return;
    }
    const menuHidden = !parentDiv.contains(menu);
    if (text.length <= minimumCharacters) {
      if (!menuHidden) {
        parentDiv.removeChild(menu);
      }
      return;
    }

    if (menuHidden) {
      parentDiv.appendChild(menu);
    }

    results = emoji.search(text).slice(0, 5);
    clearMenu();
    results.forEach(createMenuElement(results.length));
  };

  const inputEventListener = async (e: InputEvent) => {
    if (e.data === ":") {
      if (!emojiOn) {
        const textarea = e.target as HTMLTextAreaElement;
        if (
          !/[a-zA-Z0-9)]/.test(
            textarea.value.charAt(textarea.selectionStart - 2)
          )
        ) {
          turnOnEmoji();
        }
      } else if (!emoji.hasEmoji(searchText)) {
        turnOffEmoji();
      } else {
        searchText = `${searchText}:`;
        insertEmoji(e.target as HTMLTextAreaElement, emoji.get(searchText));
      }
    } else if (e.inputType === "deleteContentBackward") {
      if (searchText === ":") {
        turnOffEmoji();
      } else {
        searchText = searchText.substring(0, searchText.length - 1);
        searchEmojis(searchText);
      }
    } else if (!/\s/.test(e.data) && e.data && emojiOn) {
      searchText += e.data;
      searchEmojis(searchText);
    } else {
      turnOffEmoji();
    }
  };

  document.addEventListener("input", inputEventListener);
});
