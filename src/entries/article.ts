import {
  createButtonObserver,
  getActiveUids,
  getFirstChildUidByBlockUid,
  getUidsFromId,
  updateActiveBlock,
} from "roam-client";
import urlRegex from "url-regex-safe";
import {
  ERROR_MESSAGE,
  getIndentConfig,
  importArticle,
  renderImportArticle,
} from "../components/ImportArticle";
import { createCustomSmartBlockCommand, runExtension } from "../entry-helpers";

const inlineImportArticle = async ({
  value,
  parentUid,
}: {
  value: string;
  parentUid: string;
}) => {
  const match = value.match(urlRegex({ strict: true }));
  if (match) {
    const indent = getIndentConfig();
    const url = match[0];
    window.roamAlphaAPI.createBlock({
      block: { string: "Loading..." },
      location: { "parent-uid": parentUid, order: 0 },
    });
    const blockUid = await new Promise<string>((resolve) =>
      setTimeout(() => resolve(getFirstChildUidByBlockUid(parentUid)), 1)
    );
    await importArticle({
      url,
      blockUid,
      indent,
    }).catch(() => {
      updateActiveBlock(ERROR_MESSAGE);
    });
    return `[Source](${url})`;
  } else {
    return "Invalid Article URL";
  }
};

runExtension("article", () => {
  createButtonObserver({
    shortcut: "article",
    attribute: "import-article",
    render: (b: HTMLButtonElement) =>
      renderImportArticle(b.closest(".roam-block").id, b.parentElement),
  });

  document.addEventListener("keydown", async (e) => {
    if (e.altKey && e.shiftKey && e.key === "I") {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") {
        const value = (target as HTMLTextAreaElement).value;
        const { blockUid } = getUidsFromId(target.id);
        await inlineImportArticle({ value, parentUid: blockUid });
      }
    }
  });

  createCustomSmartBlockCommand({
    command: "ARTICLE",
    processor: async (value) => {
      const { blockUid } = getActiveUids();
      return inlineImportArticle({ value, parentUid: blockUid });
    },
  });
});
