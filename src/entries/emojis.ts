import emoji from "node-emoji";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/dom";

let searchText = "";
let emojiOn = false;

const turnOnEmoji = () => (emojiOn = true);
const turnOffEmoji = () => {
  searchText = "";
  emojiOn = false;
};

const waitForCallback = (text: string) => () => {
  const textArea = document.activeElement as HTMLTextAreaElement;
  if (textArea.value.toUpperCase() !== text.toUpperCase()) {
    throw new Error("Typing not complete");
  }
};

const inputEventListener = async (e: InputEvent) => {
  if (e.data === ":") {
    if (!emojiOn) {
      turnOnEmoji();
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
  } else if (!/\s/.test(e.data) && e.data && emojiOn) {
    searchText += e.data;
  } else {
    turnOffEmoji();
  }
};

document.addEventListener("input", inputEventListener);
