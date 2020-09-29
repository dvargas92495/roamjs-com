import { wait, waitFor, waitForElement } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import {
  createOverlayObserver,
  getConfigFromPage,
  getUids,
} from "../entry-helpers";

let blockElementSelected: Element;

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
aTag.onclick = async () => {
  if (!blockElementSelected) {
    return;
  }

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
  const replace = (input: string) => Object.keys(uidByAlias).reduce(
    (prevText: string, alias: string) => {
      const regex = new RegExp(`${alias}`, 'g');
      return prevText.replace(regex, `[${alias}](((${uidByAlias[alias]})))`);
    },
    input
  );
  if (window.roamDatomicAlphaAPI) {
    const { blockUid } = getUids(blockElementSelected);
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
    if (blockElementSelected.tagName === "DIV") {
      userEvent.click(blockElementSelected);
      await waitFor(() => {
        if (document.getElementById(id).tagName !== "TEXTAREA") {
          throw new Error("Click did not render textarea");
        }
      });
    }
    const textArea = document.getElementById(id) as HTMLTextAreaElement;
    const newText = replace(textArea.value);
    userEvent.clear(textArea);
    userEvent.type(textArea, newText);
  }
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

document.addEventListener("mousedown", (e) => {
  if (e.button !== 2) {
    return;
  }
  const htmlTarget = e.target as HTMLElement;
  if (
    htmlTarget.className === "simple-bullet-outer cursor-pointer" ||
    htmlTarget.className === "simple-bullet-inner"
  ) {
    const bullet = htmlTarget.closest(".controls");
    blockElementSelected =
      bullet.nextElementSibling.className.indexOf("roam-block") > -1
        ? bullet.nextElementSibling
        : bullet.nextElementSibling.getElementsByClassName("roam-block-input")[0];
  }
});
