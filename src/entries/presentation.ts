import { addStyle } from "../entry-helpers";
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
  ANIMATE_REGEX,
  COLLAPSIBLE_REGEX,
  render,
  TRANSITION_REGEX,
  VALID_THEMES,
} from "../components/Presentation";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import createButtonObserver from "roamjs-components/dom/createButtonObserver";
import getUidsFromButton from "roamjs-components/dom/getUidsFromButton";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import runExtension from "roamjs-components/util/runExtension";

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
.roamjs-presentation-img-dialog {
  z-index: 2100;
}
.roamjs-presentation-img-dialog .bp3-dialog {
  position: absolute;
  top: 32px;
  bottom: 32px;
  left: 32px;
  right: 32px;
  width: unset;
  background-color: transparent;
}
.roamjs-collapsible-bullet, .roamjs-document-li {
  list-style: none;
}
.reveal .roamjs-bullets-container h1, .reveal .roamjs-bullets-container h2, .reveal .roamjs-bullets-container h3, .reveal .roamjs-bullets-container h4, .reveal .roamjs-bullets-container h5, .reveal .roamjs-bullets-container h6 {
  margin-bottom: 0;
  text-transform: none;
}
.roamjs-bullets-container .check-container input:checked~.checkmark:after {
  display: block;
  width: 15px;
  height: 30px;
  left: 11.5px;
  top: 0.75px;
  border-width: 0 6px 6px 0;
}
.roamjs-bullets-container .check-container {
  height: 36px;
  width: 36px;
  top: 3px;
}
.reveal li>blockquote {
  font-size: 1em;
  width: 100%;
  padding: 10px 20px;
}
.roamjs-bullets-container iframe {
  position: unset;
}
.reveal .roam-render .roam-block-container .rm-block-children {
  display: none;
}

.reveal .excalidraw-host {
  pointer-events: none;
  display: inline-block;
}

.reveal .rm-block-ref {
  pointer-events: none;
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
      const buttonText = text.match(
        "{{(presentation|slides|#?\\[\\[presentation\\]\\]|#?\\[\\[slides\\]\\]|#presentation|#slides):(.*)}}"
      )?.[2];
      const options = buttonText
        ? {
            theme: buttonText.match(
              `(?:\\[\\[{|{\\[\\[|{)theme:(${VALID_THEMES.join(
                "|"
              )})(?:\\]\\]}|}\\]\\]|})`
            )?.[1],
            notes: buttonText.match(
              "(?:\\[\\[{|{\\[\\[|{)notes:(true|false)(?:\\]\\]}|}\\]\\]|})"
            )?.[1],
            collapsible: !!buttonText.match(COLLAPSIBLE_REGEX),
            animate: !!buttonText.match(ANIMATE_REGEX),
            transition: buttonText.match(TRANSITION_REGEX)?.[1] || "",
          }
        : {};
      render({
        button,
        getSlides: () => getFullTreeByParentUid(blockUid).children,
        options,
      });
    },
  });
});
