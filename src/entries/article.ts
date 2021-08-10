import {
  createBlock,
  createButtonObserver,
  getActiveUids,
  getFirstChildUidByBlockUid,
  getUidsFromId,
  registerSmartBlocksCommand,
  updateBlock,
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
    const loadingUid = createBlock({
      node: { text: "Loading..." },
      parentUid,
    });
    const blockUid = await new Promise<string>((resolve) =>
      setTimeout(() => resolve(getFirstChildUidByBlockUid(parentUid)), 1)
    );
    await importArticle({
      url,
      blockUid,
      indent,
    }).catch(() => {
      updateBlock({ uid: loadingUid, text: ERROR_MESSAGE });
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

  // legacy v1
  createCustomSmartBlockCommand({
    command: "ARTICLE",
    processor: async (value) => {
      const { blockUid } = getActiveUids();
      return inlineImportArticle({ value, parentUid: blockUid });
    },
  });

  // v2
  registerSmartBlocksCommand({
    text: "ARTICLE",
    handler: () => (value) => {
      return 'Smart blocks V2 currently doesnt support article command. Reach out to support@roamjs.com if you need this feature!';
    },
  });
});
