import {
  addStyle,
  createButtonObserver,
  getTextByBlockUid,
  runExtension,
} from "../entry-helpers";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";
import "reveal.js/dist/theme/white.css";
import "reveal.js/dist/theme/beige.css";
import "reveal.js/dist/theme/sky.css";
import "reveal.js/dist/theme/night.css";
import "reveal.js/dist/theme/simple.css";
import "reveal.js/dist/theme/league.css";
import "reveal.js/dist/theme/serif.css";
import "reveal.js/dist/theme/solarized.css";
import "reveal.js/dist/theme/blood.css";
import "reveal.js/dist/theme/moon.css";
import {
  COLLAPSIBLE_REGEX,
  render,
  VALID_THEMES,
} from "../components/Presentation";
import { getUidsFromButton, getTreeByBlockUid } from "roam-client";

addStyle(`.roamjs-collapsible-caret {
  position: absolute;
  top: 12px;
  left: -45px;
  cursor: pointer;
}
.reveal ul {
  list-style-type: disc !important;
}
.reveal ol {
  list-style-type: decimal !important;
}
`);

runExtension("presentation", async () => {
  createButtonObserver({
    attribute: "presentation",
    shortcut: "slides",
    render: (button: HTMLButtonElement) => {
      const { blockUid } = getUidsFromButton(button);
      if (!blockUid) {
        return;
      }
      const text = getTextByBlockUid(blockUid);
      const buttonText = text.match("{{(presentation|slides):(.*)}}")?.[2];
      const options = buttonText
        ? {
            theme: buttonText.match(`{theme:(${VALID_THEMES.join("|")})}`)?.[1],
            notes: buttonText.match("{notes:(true|false)}")?.[1],
            collapsible: !!buttonText.match(COLLAPSIBLE_REGEX),
          }
        : {};
      render({
        button,
        getSlides: () => getTreeByBlockUid(blockUid).children,
        options,
      });
    },
  });
});
