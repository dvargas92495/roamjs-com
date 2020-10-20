import userEvent from "@testing-library/user-event";
import { createMobileIcon, createObserver } from "../entry-helpers";
import { isIOS } from 'mobile-device-detect';

const MOBILE_MORE_ICON_BUTTON_ID = "mobile-more-icon-button";
const MOBILE_BACK_ICON_BUTTON_ID = "mobile-back-icon-button";

let previousActiveElement: HTMLElement;

const moreIconButton = createMobileIcon(MOBILE_MORE_ICON_BUTTON_ID, "menu");
const backIconButton = createMobileIcon(
  MOBILE_BACK_ICON_BUTTON_ID,
  "arrow-left"
);
const todoIconButton = createMobileIcon(
  "mobile-todo-icon-button",
  "check-square"
);
let menuItems: Element[] = [];

moreIconButton.onclick = () => {
  const mobileBar = document.getElementById("rm-mobile-bar");
  menuItems = Array.from(mobileBar.children);
  Array.from(mobileBar.children).forEach((n) => mobileBar.removeChild(n));
  mobileBar.appendChild(todoIconButton);
  mobileBar.appendChild(backIconButton);
  if (previousActiveElement.tagName === "TEXTAREA") {
    previousActiveElement.focus();
  }
};

backIconButton.onclick = () => {
  const mobileBar = document.getElementById("rm-mobile-bar");
  Array.from(mobileBar.children).forEach((n) => mobileBar.removeChild(n));
  menuItems.forEach((n) => mobileBar.appendChild(n));
  if (previousActiveElement.tagName === "TEXTAREA") {
    previousActiveElement.focus();
  }
};

todoIconButton.onclick = () => {
  if (previousActiveElement.tagName === "TEXTAREA") {
    const modifier = isIOS ? "meta" : "ctrl";
    userEvent.type(previousActiveElement, `{${modifier}}{enter}{/${modifier}}{backspace}`);
  }
};

moreIconButton.onmousedown = () => {
  previousActiveElement = document.activeElement as HTMLElement;
};

backIconButton.onmousedown = () => {
  previousActiveElement = document.activeElement as HTMLElement;
};

todoIconButton.onmousedown = () => {
  previousActiveElement = document.activeElement as HTMLElement;
};

createObserver(() => {
  if (
    !document.getElementById(MOBILE_MORE_ICON_BUTTON_ID) &&
    !document.getElementById(MOBILE_BACK_ICON_BUTTON_ID)
  ) {
    const mobileBar = document.getElementById("rm-mobile-bar");
    if (mobileBar) {
      mobileBar.appendChild(moreIconButton);
    }
  }
});
