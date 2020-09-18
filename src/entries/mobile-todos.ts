import { createObserver } from "../entry-helpers";

const MOBILE_MORE_ICON_BUTTON_ID = "mobile-more-icon-button";

const createMobileIcon = (id: string, iconType: string) => {
  const iconButton = document.createElement("button");
  iconButton.id = id;
  iconButton.className =
    "bp3-button bp3-minimal rm-mobile-button dont-unfocus-block";
  iconButton.style.padding = "6px 4px 4px;";
  const icon = document.createElement("i");
  icon.className = `zmdi zmdi-hc-fw-rc zmdi-${iconType}`;
  icon.style.cursor = "pointer";
  icon.style.color = "rgb(92, 112, 128)";
  icon.style.fontSize = "18px";
  icon.style.transform = "scale(1.2)";
  icon.style.fontWeight = "1.8";
  icon.style.margin = "8px 4px";
  iconButton.appendChild(icon);
  return iconButton;
};

const moreIconButton = createMobileIcon(MOBILE_MORE_ICON_BUTTON_ID, "menu");
const backIconButton = createMobileIcon(
  "mobile-back-icon-button",
  "arrow-left"
);
const todoIconButton = createMobileIcon(
  "mobile-todo-icon-button",
  "check-square"
);
let menuItems: HTMLElement[] = [];

moreIconButton.onclick = () => {
  const mobileBar = document.getElementById("rm-mobile-bar");
  Array.from(mobileBar.children).forEach(n => mobileBar.removeChild(n));
  mobileBar.appendChild(todoIconButton);
  mobileBar.appendChild(backIconButton);
};

backIconButton.onclick = () => {
  const mobileBar = document.getElementById("rm-mobile-bar");
  Array.from(mobileBar.children).forEach(n => mobileBar.removeChild(n));
  menuItems.forEach(n => mobileBar.appendChild(n));
}

createObserver(() => {
  if (!document.getElementById(MOBILE_MORE_ICON_BUTTON_ID)) {
    const mobileBar = document.getElementById("rm-mobile-bar");
    if (mobileBar) {
      mobileBar.appendChild(moreIconButton);
      menuItems = Array.from(moreIconButton.children);
    }
  }
});
