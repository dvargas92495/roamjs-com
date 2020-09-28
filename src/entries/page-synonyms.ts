import { createOverlayObserver, getConfigFromPage } from "../entry-helpers";

const option = document.createElement("li");
const aTag = document.createElement("a");
aTag.setAttribute("label", "Alt-A");
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
aTag.onclick = () => {
  const pagesWithAliases = window.roamAlphaAPI
    .q(
      `[:find (pull ?parentPage [*]) :where [?parentPage :block/children ?referencingBlock] [?referencingBlock :block/refs ?referencedPage] [?referencedPage :node/title "Aliases"]]`
    )
    .map((p) => p[0]);
  const uidWithAliases = pagesWithAliases.map((p) => ({
      title: p.title,
    uid: p.uid,
    aliases:
      getConfigFromPage(p.title)
        ?.Aliases?.split(",")
        ?.map((a: string) => a.trim()) || [],
  }));
  const uidByAlias: { [key: string]: string } = {};
  uidWithAliases.forEach((p) => {
    p.aliases.forEach((a: string) => (uidByAlias[a] = p.uid));
    uidByAlias[p.title] = p.uid;
  });
  console.log(uidByAlias);
};

createOverlayObserver(() => {
  const uls = document.getElementsByClassName("bp3-menu bp3-text-small");
  Array.from(uls).forEach((ul) => {
    if (ul.tagName === "UL" && !ul.contains(option)) {
      const dividers = Array.from(
        ul.getElementsByClassName("bp3-menu-divider")
      );
      if (dividers.length > 0) {
        const divider = dividers[0];
        ul.insertBefore(option, divider);
      }
    }
  });
});
