let searchText = "";
let emojiOn = false;

const turnOnEmoji = () => (emojiOn = true);
const turnOffEmoji = () => {
  searchText = "";
  emojiOn = false;
};

const inputEventListener = (e: InputEvent) => {
  if (e.data === ":") {
    if (emojiOn) {
      turnOnEmoji();
    } else {
      console.log("GET EMOJI FOR - " + searchText);
      turnOffEmoji();
    }
  } else if (!/\s/.test(e.data) && e.data) {
    searchText += e.data;
  } else {
    turnOffEmoji();
  }
};

document.addEventListener("input", inputEventListener);
