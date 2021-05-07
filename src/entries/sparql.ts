import {
  createBlockObserver,
  createHTMLObserver,
  createIconButton,
  deleteBlock,
  getPageUidByPageTitle,
  getShallowTreeByParentUid,
  getUids,
} from "roam-client";
import { createConfigObserver } from "roamjs-components";
import {
  DEFAULT_EXPORT_LABEL,
  OutputFormat,
  render,
  RenderProps,
  runSparqlQuery,
} from "../components/SparqlQuery";
import { addStyle, runExtension, toFlexRegex } from "../entry-helpers";

addStyle(`.roamjs-sparql-editor .cm-comment {
  color: #72777d;
}

.roamjs-sparql-editor .cm-keyword {
  color: #b32424;
}

.roamjs-sparql-editor .cm-variable-2 {
  color: #14866d;
}

.roamjs-sparql-editor .cm-atom {
  color: #2a4b8d;
}

.roamjs-sparql-editor .cm-string {
  color: #ac6600;
}

.roamjs-sparql-editor .cm-bracket {
  color: inherit;
}

.roamjs-sparql-editor .cm-operator {
  color: inherit;
}`);

const ID = "sparql";
const CONFIG = `roam/js/${ID}`;
const textareaRef: RenderProps["textareaRef"] = {
  current: null,
};
const queriesCache: RenderProps["queriesCache"] = {};

runExtension(ID, () => {
  createConfigObserver({
    title: CONFIG,
    config: {
      tabs: [
        {
          id: "import",
          fields: [{
            type: 'text',
            title: 'default label',
            description: 'The default label each Sparql query will have on import',
            defaultValue: DEFAULT_EXPORT_LABEL,
          }],
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
      };
      b.appendChild(updateButton);
    }
  });

  window.roamAlphaAPI.ui.commandPalette.addCommand({
    label: "Run SPARQL Query",
    callback: () => render({ textareaRef, queriesCache }),
  });
});
