let searchText = "";
let emojiOn = false;

const turnOnEmoji = () => emojiOn = true;
const turnOffEmoji = () => emojiOn = false;

const inputEventListener = (e: InputEvent) => {
    if (e.data === ":") {
        if (emojiOn) {
            turnOnEmoji();
        } else {
            turnOffEmoji();
            console.log("GET EMOJI FOR - " + searchText);
        }
    } else if (!/\s/.test(e.data)) {
        searchText += e.data
    } else {
        turnOffEmoji();
    }

} 

document.addEventListener("input", inputEventListener);