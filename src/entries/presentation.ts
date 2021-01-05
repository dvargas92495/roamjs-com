import {
  createButtonObserver,
  getTextTreeByBlockUid,
  runExtension,
} from "../entry-helpers";
import { getUidsFromButton } from "roam-client";

runExtension("presentation", async () => {
  await import("reveal.js/dist/reveal.css");
  await import("reveal.js/dist/theme/black.css");
  await import("reveal.js/dist/theme/white.css");
  await import("reveal.js/dist/theme/beige.css");
  await import("reveal.js/dist/theme/sky.css");
  await import("reveal.js/dist/theme/night.css");
  await import("reveal.js/dist/theme/simple.css");
  await import("reveal.js/dist/theme/league.css");
  await import("reveal.js/dist/theme/serif.css");
  await import("reveal.js/dist/theme/solarized.css");
  await import("reveal.js/dist/theme/blood.css");
  await import("reveal.js/dist/theme/moon.css");
  const { render, VALID_THEMES } = await import("../components/Presentation");
  
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
            notes: buttonText.match("{notes:(true|false)}")?.[1],
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
