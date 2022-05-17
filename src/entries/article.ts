import {
  createBlock,
  createButtonObserver,
  getFirstChildUidByBlockUid,
  getUidsFromId,
  updateBlock,
} from "roam-client";
import urlRegex from "url-regex-safe";
import {
  ERROR_MESSAGE,
  getIndentConfig,
  importArticle,
  renderImportArticle,
} from "../components/ImportArticle";
import runExtension from "roamjs-components/util/runExtension";
import registerSmartBlocksCommand from "roamjs-components/util/registerSmartBlocksCommand";

const inlineImportArticle = async ({
  value,
  parentUid,
}: {
  value: string;
  parentUid?: string;
}) => {
  const match = value.match(urlRegex({ strict: true }));
  if (match) {
    const indent = getIndentConfig();
    const url = match[0];
    if (parentUid) {
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
      return importArticle({ url, indent });
    }
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
    if (e.altKey && e.shiftKey && (e.key === "I" || e.code === "KeyI")) {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") {
        const value = (target as HTMLTextAreaElement).value;
        const { blockUid } = getUidsFromId(target.id);
        await inlineImportArticle({ value, parentUid: blockUid });
      }
    }
  });

  // v2
  registerSmartBlocksCommand({
    text: "ARTICLE",
    handler: () => (value) => {
      return inlineImportArticle({ value });
    },
  });
});
