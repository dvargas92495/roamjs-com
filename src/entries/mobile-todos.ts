import { createObserver } from "../entry-helpers";

const MOBILE_MORE_ICON_BUTTON_ID = "mobile-more-icon-button";

const mobileBar = document.getElementsByClassName("rm-mobile-bar")[0];
const moreIconButton = document.createElement("button");
moreIconButton.id = MOBILE_MORE_ICON_BUTTON_ID;
moreIconButton.className =
  "bp3-button bp3-minimal rm-mobile-button dont-unfocus-block";
moreIconButton.style.padding = "6px 4px 4px;";
const moreIcon = document.createElement("i");
moreIcon.className = "zmdi zmdi-hc-fw-rc zmdi-menu";
moreIcon.style.cursor = "pointer";
moreIcon.style.color = "rgb(92, 112, 128)";
moreIcon.style.fontSize = "18px";
moreIcon.style.transform = "scale(1.2)";
moreIcon.style.fontWeight = "1.8";
moreIcon.style.margin = "8px 4px";
moreIconButton.appendChild(moreIcon);

createObserver(() => {
  if (!document.getElementById(MOBILE_MORE_ICON_BUTTON_ID)) {
    mobileBar.appendChild(moreIconButton);
  }
});
