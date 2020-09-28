import { createObserver } from "../entry-helpers";

const option = document.createElement("li");
const aTag = document.createElement("a");
aTag.setAttribute("label", "Alt-A");
aTag.className = "bp3-menu-item bp3-popover-dismiss";
option.appendChild(aTag)
const optionText = document.createElement('div');
optionText.className = "bp3-text-overflow-ellipsis bp3-fill";
optionText.innerText = "Alias Page Synonyms";
aTag.appendChild(optionText);
const shortcut = document.createElement("span");
shortcut.className = "bp3-menu-item-label";
shortcut.innerText = "Alt-A";
aTag.appendChild(shortcut);

createObserver(() => {
    const uls = document.getElementsByClassName("bp3-menu bp3-text-small");
    Array.from(uls).forEach((ul) => {
        if (ul.tagName === "UL") {
            const dividers = Array.from(ul.getElementsByClassName('bp3-menu-divieder'));
            if (dividers.length > 0) {
                const divider = dividers[0];
                ul.insertBefore(option, divider);
            }
        }
    })
});