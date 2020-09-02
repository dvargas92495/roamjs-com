import emoji from "node-emoji";
import userEvent from "@testing-library/user-event";

let searchText = "";
let emojiOn = false;

// The following styling is ripped from Roam's menu style
let menu = document.createElement("div");
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

const menuElementCache: { [key: string]: HTMLDivElement } = {};

const createMenuElement = ({ emoji, key }: emoji.Emoji) => {
  if (menuElementCache[key]) {
    menu.appendChild(menuElementCache[key]);
    return;
  }

  const title = `${key} ${emoji}`;
  const container = document.createElement("div");
  container.title = title;
  container.className = "dont-unfocus-block";
  container.style.borderRadius = "2px";
  container.style.padding = "6px";
  container.style.cursor = "pointer";

  const result = document.createElement("div");
  result.className = "rm-autocomplete-result";
  result.innerText = title;
  container.appendChild(result);

  menuElementCache[key] = container;
  menu.appendChild(container);
};

const clearMenu = () => {
  while (menu.lastChild) {
    menu.removeChild(menu.lastChild);
  }
};

const turnOnEmoji = () => {
  const parentDiv = document.activeElement.parentElement as HTMLDivElement;
  parentDiv.appendChild(menu);
  emojiOn = true;
};

const turnOffEmoji = () => {
  const parentDiv = document.activeElement.parentElement as HTMLDivElement;
  parentDiv.removeChild(menu);
  clearMenu();
  searchText = "";
  emojiOn = false;
};

const inputEventListener = async (e: InputEvent) => {
  if (e.data === ":") {
    if (!emojiOn) {
      turnOnEmoji();
    } else if (!emoji.hasEmoji(searchText)) {
      turnOffEmoji();
    } else {
      const emojiCode = emoji.get(searchText);
      const target = e.target as HTMLTextAreaElement;
      const initialValue = target.value;
      const preValue = initialValue.substring(
        0,
        initialValue.length - 2 - searchText.length
      );
      target.setSelectionRange(preValue.length, initialValue.length);
      userEvent.type(target, "{backspace}");
      userEvent.type(target, emojiCode);
      turnOffEmoji();
    }
  } else if (e.inputType === "deleteContentBackward") {
    if (searchText) {
      searchText = searchText.substring(0, searchText.length - 1);
      const results = emoji.search(searchText);
      clearMenu();
      results.slice(0, 5).forEach(createMenuElement);
    } else {
      turnOffEmoji();
    }
  } else if (!/\s/.test(e.data) && e.data && emojiOn) {
    searchText += e.data;
  } else {
    turnOffEmoji();
  }
};

document.addEventListener("input", inputEventListener);
