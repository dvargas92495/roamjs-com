import { isApple, runExtension } from "../entry-helpers";
import {
  createOverlayObserver,
  extractTag,
  getConfigFromPage,
  getTextByBlockUid,
  getTreeByPageName,
  getUids,
  getUidsFromId,
} from "roam-client";

const ALIAS_PAGE_SYNONYM_OPTION_CLASSNAME = "roamjs-alias-page-synonyms";
const ALIAS_PAGE_SYNONYM_ATTRIBUTE = "data-roamjs-has-alias-option";

const createMenuOption = (menuOnClick: () => void) => {
  const option = document.createElement("li");
  const aTag = document.createElement("a");
  aTag.setAttribute("label", `${isApple ? "Opt" : "Alt"}-A`);
  aTag.className = "bp3-menu-item bp3-popover-dismiss";
  option.appendChild(aTag);
  const optionText = document.createElement("div");
  optionText.className = "bp3-text-overflow-ellipsis bp3-fill";
  optionText.innerText = "Alias Page Synonyms";
  aTag.appendChild(optionText);
  const shortcut = document.createElement("span");
  shortcut.className = "bp3-menu-item-label";
  shortcut.innerText = "Alt-A";
  aTag.appendChild(shortcut);
  aTag.onclick = menuOnClick;
  option.className = ALIAS_PAGE_SYNONYM_OPTION_CLASSNAME;
  return option;
};

const getReplacer = () => {
  const tree = getTreeByPageName("roam/js/page-synonyms");
  const useTags = tree.some((t) => t.text.toUpperCase() === "USE TAGS");
  const uidWithAliases = window.roamAlphaAPI
    .q(
      `[:find (pull ?parentPage [:block/uid :node/title]) (pull ?referencingBlock [[:block/string :as "text"]]) :where 
        [?referencedPage :node/title "Aliases"] 
        [?referencingBlock :block/refs ?referencedPage] 
        [?referencingBlock :block/page ?parentPage]]`
    )
    .map(([{ uid, title }, { text }]: Record<string, string>[]) => ({
      uid,
      title,
      aliases: (
        text
          .replace(/^Aliases::/, "")
          .trim()
          .split(",") || []
      )
        .map((a: string) => extractTag(a.trim()))
        .filter((a: string) => !!a),
    })).filter(({aliases}) => aliases.length);
  const linkByAlias: { [key: string]: string } = {};
  uidWithAliases.forEach((p) => {
    const link = useTags ? `[[${p.title}]]` : `((${p.uid}))`;
    p.aliases.forEach((a: string) => (linkByAlias[a] = link));
    linkByAlias[p.title] = link;
  });
  return (input: string) =>
    Object.keys(linkByAlias)
      .sort((a, b) => b.length - a.length)
      .reduce((prevText: string, alias: string) => {
        const regex = new RegExp(
          `(^|[^a-zA-Z0-9_\\[\\]])${alias}([^a-zA-Z0-9_\\[\\]]|$)`,
          "g"
        );
        return prevText.replace(regex, (match) =>
          match.replace(alias, `[${alias}](${linkByAlias[alias]})`)
        );
      }, input);
};

const optionCallback = (blockUid: string) => {
  const replace = getReplacer();
  const blockContent = getTextByBlockUid(blockUid);
  const newText = replace(blockContent);
  window.roamAlphaAPI.updateBlock({
    block: {
      uid: blockUid,
      string: newText,
    },
  });
};

runExtension("page-synonyms", () => {
  window.roamAlphaAPI.ui.blockContextMenu.addCommand({
    label: "Alias Page Synonyms (Alt-A)",
    callback: (props) => optionCallback(props["block-uid"]),
  });

  const multiOption = createMenuOption(async () => {
    const replace = getReplacer();
    const highlightedDivIds = Array.from(
      document.getElementsByClassName("block-highlight-blue")
    ).map((d) => d.getElementsByClassName("roam-block")[0].id);
    highlightedDivIds.forEach(async (id: string) => {
      const { blockUid } = getUidsFromId(id);
      const blockContent = getTextByBlockUid(blockUid);
      const newText = replace(blockContent);
      window.roamAlphaAPI.updateBlock({
        block: {
          uid: blockUid,
          string: newText,
        },
      });
    });
  });

  createOverlayObserver(() => {
    const uls = document.getElementsByClassName("bp3-menu bp3-text-small");
    Array.from(uls)
      .filter((u) => !u.hasAttribute(ALIAS_PAGE_SYNONYM_ATTRIBUTE))
      .forEach((u) => {
        if (
          u.tagName === "UL" &&
          !u.getElementsByClassName(ALIAS_PAGE_SYNONYM_OPTION_CLASSNAME).length
        ) {
          const ul = u as HTMLUListElement;
          ul.setAttribute(ALIAS_PAGE_SYNONYM_ATTRIBUTE, "true");
          if (
            !ul.contains(multiOption) &&
            ul.innerText.includes("Copy block refs")
          ) {
            ul.appendChild(multiOption);
          }
        }
      });
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "KeyA" && e.altKey) {
      if (document.activeElement.tagName === "TEXTAREA") {
        optionCallback(
          getUids(document.activeElement as HTMLTextAreaElement).blockUid
        );
        e.preventDefault();
      }
    }
  });
});
