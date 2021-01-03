import {
  createButtonObserver,
  getTextTreeByBlockUid,
  runExtension,
} from "../entry-helpers";

import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";
import "reveal.js/dist/theme/white.css";
import "reveal.js/dist/theme/beige.css";
/*
import "reveal.js/dist/theme/sky.css";
import "reveal.js/dist/theme/night.css";
import "reveal.js/dist/theme/simple.css";
import "reveal.js/dist/theme/league.css";
import "reveal.js/dist/theme/serif.css";
import "reveal.js/dist/theme/solarized.css";
import "reveal.js/dist/theme/blood.css";
import "reveal.js/dist/theme/moon.css";
*/
import { render, VALID_THEMES } from "../components/Presentation";
import { getUidsFromButton } from "roam-client";

runExtension("presentation", () => {
  createButtonObserver({
    attribute: "presentation",
    shortcut: "slides",
    render: (button: HTMLButtonElement) => {
      const { blockUid } = getUidsFromButton(button);
      const { text } = getTextTreeByBlockUid(blockUid);
      const buttonText = text.match("{{(presentation|slides):(.*)}}")?.[2];
      const options = buttonText
        ? {
            theme: buttonText.match(`{theme:(${VALID_THEMES.join("|")})}`)?.[1],
            notes: buttonText.match('{notes:(true|false)}')?.[1],
          }
        : {};
      render({
        button,
        getSlides: () => getTextTreeByBlockUid(blockUid).children,
        options,
      });
    },
  });
});
