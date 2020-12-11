import {
  createPageObserver,
  getBlockDepthByBlockUid,
  getParentUidByBlockUid,
  getTextTreeByBlockUid,
  getTextTreeByPageName,
  replaceTagText,
  replaceText,
  runExtension,
  TreeNode,
} from "../entry-helpers";

declare global {
  interface Window {
    observerCount: number;
  }
}

window.observerCount = 0;

runExtension("tag-cycle", () => {
  const config: { [blockUid: string]: (e: KeyboardEvent) => void } = {};
  const blockUidsByKeystroke: { [keystroke: string]: Set<string> } = {};

  const cleanConfig = (blockUid: string) => {
    if (config[blockUid]) {
      document.removeEventListener("keydown", config[blockUid]);
      delete config[blockUid];
      const uids = Object.values(blockUidsByKeystroke).find((v) =>
        v.has(blockUid)
      );
      if (uids) {
        uids.delete(blockUid);
      }
    }
  };

  const configureShortcut = (shortcut: Omit<TreeNode, "order">) => {
    const parts = shortcut.text.split("+").map((s) => s.toUpperCase().trim());
    const modifier = parts[0];
    const isShift = parts[1] === "SHIFT";
    const keyParts = parts[parts.length - 1].split(" ") || [""];
    const key = keyParts[0];
    const modifiers = keyParts.slice(1).map((s) => s.toUpperCase());
    const cycle = shortcut.children.map((c) => c.text.trim());
    const sortedCycle = cycle
      .map((tag, index) => ({ tag, index }))
      .sort((a, b) => b.tag.length - a.tag.length);
    const isTriggered = (e: KeyboardEvent) => {
      if (modifier === "ALT" && !e.altKey) {
        return false;
      }
      if (modifier === "OPT" && !e.altKey) {
        return false;
      }
      if (modifier === "CMD" && !e.metaKey) {
        return false;
      }
      if (modifier === "WIN" && !e.metaKey) {
        return false;
      }
      if (modifier === "CTRL" && !e.ctrlKey) {
        return false;
      }
      if (isShift && !e.shiftKey) {
        return false;
      }
      if (key === "SPACE" && e.key === " ") {
        return true;
      }
      if (key === e.key.toUpperCase()) {
        return true;
      }
      return false;
    };
    cleanConfig(shortcut.uid);
    const keyStroke = [...parts.slice(0, parts.length - 1), key].join("+");
    if (blockUidsByKeystroke[keyStroke]) {
      blockUidsByKeystroke[keyStroke].add(shortcut.uid);
    } else {
      blockUidsByKeystroke[keyStroke] = new Set([shortcut.uid]);
    }
    config[shortcut.uid] = async (e: KeyboardEvent) => {
      const element = document.activeElement as HTMLElement;
      if (element.tagName === "TEXTAREA") {
        if (isTriggered(e)) {
          const textarea = element as HTMLTextAreaElement;
          for (let i = 0; i < sortedCycle.length; i++) {
            const { tag: tag1, index } = sortedCycle[i];
            if (
              (textarea.value.includes(tag1) &&
                modifiers.includes("RAW") &&
                tag1) ||
              (textarea.value.includes(`#[[${tag1}]]`) && tag1) ||
              (textarea.value.includes(`[[${tag1}]]`) && tag1) ||
              (textarea.value.includes(`#${tag1}`) && tag1) ||
              (!tag1 && blockUidsByKeystroke[keyStroke].size === 1)
            ) {
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const tag2 = cycle[(index + 1 + cycle.length) % cycle.length];
              const prepend = modifiers.includes("FRONT");
              if (modifiers.includes("RAW")) {
                await replaceText({ before: tag1, after: tag2, prepend });
              } else {
                await replaceTagText({
                  before: tag1,
                  after: tag2,
                  addHash: modifiers.includes("HASH"),
                  prepend,
                });
              }
              textarea.setSelectionRange(
                start - tag1.length + tag2.length,
                end - tag1.length + tag2.length
              );
              e.preventDefault();
              e.stopPropagation();
              break;
            }
          }
        }
      }
    };
    document.getElementsByClassName("roam-app")[0].addEventListener("keydown", config[shortcut.uid]);
  };

  const isValidShortcut = (t: Pick<TreeNode, "text">) =>
    t.text.toUpperCase().startsWith("CTRL+") ||
    t.text.toUpperCase().startsWith("CMD+") ||
    t.text.toUpperCase().startsWith("ALT+") ||
    t.text.toUpperCase().startsWith("OPT+") ||
    t.text.toUpperCase().startsWith("WIN+");

  getTextTreeByPageName("roam/js/tag-cycle")
    .filter(isValidShortcut)
    .forEach(configureShortcut);

  createPageObserver("roam/js/tag-cycle", (blockUid, added) => {
    if (!added) {
      cleanConfig(blockUid);
      return;
    }
    const depth = getBlockDepthByBlockUid(blockUid);
    if (depth > 2 || depth < 0) {
      return;
    }
    const uid = depth === 2 ? getParentUidByBlockUid(blockUid) : blockUid;
    const shortcut = getTextTreeByBlockUid(uid);
    if (isValidShortcut(shortcut)) {
      configureShortcut({ ...shortcut, uid });
    }
  });
});
