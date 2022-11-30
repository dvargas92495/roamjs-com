import { createConfigObserver } from "roamjs-components/components/ConfigPage";
import FlagPanel from "roamjs-components/components/ConfigPanels/FlagPanel";
import NumberPanel from "roamjs-components/components/ConfigPanels/NumberPanel";
import TextPanel from "roamjs-components/components/ConfigPanels/TextPanel";
import createBlockObserver from "roamjs-components/dom/createBlockObserver";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import createIconButton from "roamjs-components/dom/createIconButton";
import getUids from "roamjs-components/dom/getUids";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import getShallowTreeByParentUid from "roamjs-components/queries/getShallowTreeByParentUid";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import runExtension from "roamjs-components/util/runExtension";
import toFlexRegex from "roamjs-components/util/toFlexRegex";
import deleteBlock from "roamjs-components/writes/deleteBlock";
import updateBlock from "roamjs-components/writes/updateBlock";
import {
  DEFAULT_EXPORT_LABEL,
  getLabel,
  OutputFormat,
  render,
  RenderProps,
  runSparqlQuery,
} from "../components/SparqlQuery";
import { addStyle } from "../entry-helpers";

addStyle(`.roamjs-sparql-editor .cmt-comment {
  color: #72777d;
}

.roamjs-sparql-editor .cmt-keyword {
  color: #b32424;
}

.roamjs-sparql-editor .cmt-variable-2 {
  color: #14866d;
}

.roamjs-sparql-editor .cmt-atom {
  color: #2a4b8d;
}

.roamjs-sparql-editor .cmt-string {
  color: #ac6600;
}

.roamjs-sparql-editor .cmt-bracket {
  color: inherit;
}

.roamjs-sparql-editor .cmt-operator {
  color: inherit;
}`);

const ID = "sparql";
const CONFIG = `roam/js/${ID}`;
const textareaRef: RenderProps["textareaRef"] = {
  current: null,
};
const queriesCache: RenderProps["queriesCache"] = {};

runExtension({
  extensionId: ID,
  migratedTo: "Developer",
  run: () => {
    createConfigObserver({
      title: CONFIG,
      config: {
        tabs: [
          {
            id: "import",
            fields: [
              {
                Panel: TextPanel,
                title: "default label",
                description:
                  "The default label each Sparql query will have on import",
                defaultValue: DEFAULT_EXPORT_LABEL,
              },
              {
                Panel: NumberPanel,
                title: "default limit",
                description:
                  "The default limit each Sparql query will have on import",
                defaultValue: 10,
              },
              {
                Panel: FlagPanel,
                title: "qualifiers",
                description:
                  "Whether sparql queries for blocks and pages should import qualifiers by default",
              },
            ],
          },
        ],
      },
    });

    const queryUid = getShallowTreeByParentUid(
      getPageUidByPageTitle(CONFIG)
    ).find(({ text }) => toFlexRegex("queries").test(text))?.uid;
    if (queryUid) {
      getShallowTreeByParentUid(queryUid).forEach(({ uid, text }) => {
        const cache = getShallowTreeByParentUid(uid);
        queriesCache[text] = {
          query: cache[0]?.text,
          source: cache[1]?.text,
          outputFormat: cache[2]?.text as OutputFormat,
        };
      });
    }

    createHTMLObserver({
      tag: "TEXTAREA",
      className: "rm-block-input",
      callback: (t: HTMLTextAreaElement) => (textareaRef.current = t),
    });

    createBlockObserver((b) => {
      if (!b.hasAttribute("roamjs-sparql-update-button")) {
        b.setAttribute("roamjs-sparql-update-button", "true");
        const { blockUid } = getUids(b);
        const queryInfo = queriesCache[blockUid];
        if (queryInfo) {
          const updateButton = createIconButton("refresh");
          updateButton.style.float = "right";
          updateButton.onmousedown = (e) => e.stopPropagation();
          updateButton.onclick = () => {
            getShallowTreeByParentUid(blockUid).forEach(({ uid }) =>
              deleteBlock(uid)
            );
            runSparqlQuery({ ...queryInfo, parentUid: blockUid });
            updateBlock({
              uid: blockUid,
              text: getLabel({
                outputFormat: queryInfo.outputFormat,
                label: getTextByBlockUid(blockUid).replace(
                  /(\d)?\d\/(\d)?\d\/\d\d\d\d, (\d)?\d:\d\d:\d\d [A|P]M/,
                  "{date}"
                ),
              }),
            });
          };
          b.appendChild(updateButton);
        }
      }
    });

    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label: "Run SPARQL Query",
      callback: () =>
        window.roamAlphaAPI.ui.mainWindow
          .getOpenPageOrBlockUid()
          .then((parentUid) =>
            render({ textareaRef, queriesCache, parentUid })
          ),
    });

    createHTMLObserver({
      callback: (s: HTMLSpanElement) => {
        if (s.innerText === "sparql") {
          const editor = s.closest(".rm-code-block");
          if (editor && !editor.classList.contains("roamjs-sparql-editor")) {
            editor.classList.add("roamjs-sparql-editor");
          }
        }
      },
      tag: "SPAN",
      className: "bp3-button-text",
    });
  },
});
