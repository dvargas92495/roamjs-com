import {
  createOverlayObserver,
  isApple,
  runExtension,
} from "../entry-helpers";
import {
  getConfigFromPage,
  getTextByBlockUid,
  getTreeByPageName,
  getUids,
  getUidsFromId,
  RoamBlock,
} from "roam-client";

let blockElementSelected: Element;
const ALIAS_PAGE_SYNONYM_OPTION_CLASSNAME = "roamjs-alias-page-synonyms";

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
  const pagesWithAliases = window.roamAlphaAPI
    .q(
      `[:find (pull ?parentPage [*]) :where [?parentPage :block/children ?referencingBlock] [?referencingBlock :block/refs ?referencedPage] [?referencedPage :node/title "Aliases"]]`
    )
    .map((p) => p[0] as RoamBlock);
  const uidWithAliases = pagesWithAliases.map((p) => ({
    title: p.title,
    uid: p.uid,
    aliases: (getConfigFromPage(p.title)?.Aliases?.split(",") || [])
      .map((a: string) => a.trim())
      .filter((a: string) => !!a),
  }));
  const linkByAlias: { [key: string]: string } = {};
  uidWithAliases.forEach((p) => {
    const link = useTags ? `[[${p.title}]]` : `((${p.uid}))`;
    p.aliases.forEach((a: string) => (linkByAlias[a] = link));
    linkByAlias[p.title] = link;
  });
  return (input: string) =>
    Object.keys(linkByAlias).reduce((prevText: string, alias: string) => {
      const regex = new RegExp(`${alias}`, "g");
      return prevText.replace(regex, (match, i: number) =>
        i === 0 || !["#", "["].includes(prevText.charAt(i - 1))
          ? `[${alias}](${linkByAlias[alias]})`
          : match
      );
    }, input);
};

const optionCallback = () => {
  if (!blockElementSelected) {
    return;
  }
  const replace = getReplacer();
  const { blockUid } = getUids(blockElementSelected as HTMLDivElement);
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
  const option = createMenuOption(optionCallback);

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
    Array.from(uls).forEach((u) => {
      if (
        u.tagName === "UL" &&
        !u.getElementsByClassName(ALIAS_PAGE_SYNONYM_OPTION_CLASSNAME).length
      ) {
        const ul = u as HTMLUListElement;
        const dividers = Array.from(
          ul.getElementsByClassName("bp3-menu-divider")
        );
        if (dividers.length > 0 && !ul.contains(option)) {
          const divider = dividers[0];
          ul.insertBefore(option, divider);
        } else if (
          !ul.contains(multiOption) &&
          dividers.length === 0 &&
          ul.innerText.indexOf("Jump to block") === -1
        ) {
          ul.appendChild(multiOption);
        }
      }
    });
  });

  document.addEventListener("mousedown", (e) => {
    const htmlTarget = e.target as HTMLElement;
    if (
      htmlTarget.className === "rm-bullet" ||
      htmlTarget.className ===
        "bp3-icon-standard bp3-icon-caret-down rm-caret rm-caret-open rm-caret-hidden" ||
      htmlTarget.className === "rm-bullet__inner" ||
      htmlTarget.className === "rm-bullet__inner--user-icon"
    ) {
      const bullet = htmlTarget.closest(".controls");
      blockElementSelected = bullet.parentElement.getElementsByClassName(
        "rm-block-text"
      )[0];
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "KeyA" && e.altKey) {
      blockElementSelected = document.activeElement;
      optionCallback();
      e.preventDefault();
    }
  });
});
