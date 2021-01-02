import userEvent from "@testing-library/user-event";
import { createOverlayObserver, isApple, runExtension } from "../entry-helpers";
import { asyncPaste, getConfigFromPage, getUids, openBlock } from "roam-client";
import { waitFor } from "@testing-library/dom";

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
  return (input: string) =>
    Object.keys(uidByAlias).reduce((prevText: string, alias: string) => {
      const regex = new RegExp(`${alias}`, "g");
      return prevText.replace(regex, `[${alias}](((${uidByAlias[alias]})))`);
    }, input);
};

const optionCallback = async () => {
  if (!blockElementSelected) {
    return;
  }
  const replace = getReplacer();
  if (window.roamDatomicAlphaAPI) {
    const { blockUid } = getUids(blockElementSelected as HTMLDivElement);
    const blockContent = await window.roamDatomicAlphaAPI({
      action: "pull",
      uid: blockUid,
      selector: "[:block/string]",
    });
    const newText = replace(blockContent.string);
    await window.roamDatomicAlphaAPI({
      action: "update-block",
      block: {
        uid: blockUid,
        string: newText,
      },
    });
  } else {
    const id = blockElementSelected.id;
    if (
      blockElementSelected.tagName === "DIV" ||
      !document.contains(blockElementSelected)
    ) {
      userEvent.click(document.getElementById(id));
      await waitFor(() => {
        if (document.getElementById(id).tagName !== "TEXTAREA") {
          throw new Error(`Click did not render textarea ${id}`);
        }
      });
    }
    const textArea = document.getElementById(id) as HTMLTextAreaElement;
    const newText = replace(textArea.value);
    userEvent.clear(textArea);
    await asyncPaste(newText);
  }
};

runExtension("page-synonyms", () => {
  const option = createMenuOption(optionCallback);

  const multiOption = createMenuOption(async () => {
    const replace = getReplacer();
    const highlightedDivIds = Array.from(
      document.getElementsByClassName("block-highlight-blue")
    ).map((d) => d.getElementsByClassName("roam-block")[0].id);
    if (window.roamDatomicAlphaAPI) {
      highlightedDivIds.forEach(async (id: string) => {
        const { blockUid } = getUids(
          document.getElementById(id) as HTMLDivElement
        );
        const blockContent = await window.roamDatomicAlphaAPI({
          action: "pull",
          uid: blockUid,
          selector: "[:block/string]",
        });
        const newText = replace(blockContent.string);
        await window.roamDatomicAlphaAPI({
          action: "update-block",
          block: {
            uid: blockUid,
            string: newText,
          },
        });
      });
    } else {
      for (const index in highlightedDivIds) {
        const id = highlightedDivIds[index];
        await openBlock(document.getElementById(id));
        const textArea = document.getElementById(id) as HTMLTextAreaElement;
        const newText = replace(textArea.value);
        userEvent.clear(textArea);
        await asyncPaste(newText);
      }
    }
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
        htmlTarget.className === "rm-bullet__inner"
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
    }
  });
});
