import userEvent from "@testing-library/user-event";
import { asyncPaste, newBlockEnter } from "roam-client";
import urlRegex from "url-regex";
import {
  ERROR_MESSAGE,
  getIndentConfig,
  importArticle,
  renderImportArticle,
} from "../components/ImportArticle";
import {
  createButtonObserver,
  createCustomSmartBlockCommand,
  runExtension,
} from "../entry-helpers";

const inlineImportArticle = async (value: string) => {
  const match = value.match(urlRegex({ strict: true }));
  if (match) {
    const indent = getIndentConfig();
    const url = match[0];
    await newBlockEnter();
    await userEvent.tab();
    await asyncPaste("Loading...");
    await importArticle({
      url,
      blockId: document.activeElement.id,
      indent,
    }).catch(async () => {
      await userEvent.clear(document.activeElement);
      await asyncPaste(ERROR_MESSAGE);
    });
    return "";
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
        const textarea = target as HTMLTextAreaElement;
        await inlineImportArticle(textarea.value);
      }
    }
  });

  createCustomSmartBlockCommand({
    command: "ARTICLE",
    processor: (afterColon) => inlineImportArticle(afterColon),
  });
});
