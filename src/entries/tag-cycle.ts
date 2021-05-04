import { replaceTagText, replaceText, runExtension } from "../entry-helpers";
import {
  getTreeByBlockUid,
  getTreeByPageName,
  PullBlock,
  TreeNode,
} from "roam-client";

type IdsCallback = (ids: number[]) => void;
type DiffOptions = {
  addedCallback?: IdsCallback;
  removedCallback?: IdsCallback;
  callback?: (before: PullBlock, after: PullBlock) => void;
};

const diffChildren = (
  before: PullBlock,
  after: PullBlock,
  { addedCallback, removedCallback, callback }: DiffOptions
) => {
  const beforeChildren = new Set(
    (before?.[":block/children"] || []).map((d) => d[":db/id"])
  );
  const afterChildren = new Set(
    (after?.[":block/children"] || []).map((d) => d[":db/id"])
  );
  if (afterChildren.size > beforeChildren.size && addedCallback) {
    addedCallback(
      Array.from(afterChildren).filter((b) => !beforeChildren.has(b))
    );
  } else if (beforeChildren.size > afterChildren.size && removedCallback) {
    removedCallback(
      Array.from(beforeChildren).filter((b) => !afterChildren.has(b))
    );
  }
  if (callback) {
    callback(before, after);
  }
};

const watchBlock = ({
  blockUid,
  ...options
}: { blockUid: string } & DiffOptions) => {
  window.roamAlphaAPI.data.addPullWatch(
    "[:block/children :block/string]",
    `[:block/uid "${blockUid}"]`,
    (before, after) => diffChildren(before, after, options)
  );
};

const watchPage = ({
  title,
  addedCallback,
  removedCallback,
}: {
  title: string;
} & Pick<DiffOptions, "addedCallback" | "removedCallback">) => {
  window.roamAlphaAPI.data.addPullWatch(
    "[:block/children]",
    `[:node/title "${title}"]`,
    (before, after) => {
      diffChildren(before, after, { addedCallback, removedCallback });
    }
  );
};

runExtension("tag-cycle", () => {
  const config: { [blockUid: string]: (e: KeyboardEvent) => void } = {};
  const blockUidsByKeystroke: { [keystroke: string]: Set<string> } = {};
  const root = document.getElementsByClassName("roam-app")[0] || document;

  const cleanConfig = (blockUid: string) => {
    if (config[blockUid]) {
      root.removeEventListener("keydown", config[blockUid]);
      delete config[blockUid];
      const uids = Object.values(blockUidsByKeystroke).find((v) =>
        v.has(blockUid)
      );
      if (uids) {
        uids.delete(blockUid);
      }
    }
  };

  const configureShortcut = (shortcut: {
    text: string;
    children: TreeNode[];
    uid: string;
  }) => {
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
              e.preventDefault();
              e.stopPropagation();
              break;
            }
          }
        }
      }
    };
    root.addEventListener("keydown", config[shortcut.uid]);
  };

  const isValidShortcut = (t: Pick<TreeNode, "text">) =>
    /^(CTRL|CMD|ALT|OPT|WIN)(\s*)\+/i.test(t.text);

  const watchTagCycleBlockUid = (blockUid: string) => {
    const shortcutCallback = () => {
      const shortcut = getTreeByBlockUid(blockUid);
      if (isValidShortcut(shortcut)) {
        configureShortcut({ ...shortcut, uid: blockUid });
      }
    };
    watchBlock({
      blockUid,
      addedCallback: (addedIds) => {
        addedIds
          .map(
            (id) => window.roamAlphaAPI.pull("[:block/uid]", id)[":block/uid"]
          )
          .forEach((uid) =>
            watchBlock({
              blockUid: uid,
              callback: shortcutCallback,
            })
          );
        shortcutCallback();
      },
      removedCallback: shortcutCallback,
      callback: shortcutCallback,
    });
  };

  getTreeByPageName("roam/js/tag-cycle")
    .map((t) => {
      watchTagCycleBlockUid(t.uid);
      t.children.forEach((v) =>
        watchBlock({
          blockUid: v.uid,
          callback: () => {
            const c = getTreeByBlockUid(t.uid);
            return isValidShortcut(c) && configureShortcut(c);
          },
        })
      );
      return t;
    })
    .filter(isValidShortcut)
    .forEach(configureShortcut);

  watchPage({
    title: "roam/js/tag-cycle",
    addedCallback: (ids) => {
      ids
        .map((id) => window.roamAlphaAPI.pull("[:block/uid]", id)[":block/uid"])
        .forEach(watchTagCycleBlockUid);
    },
    removedCallback: (ids) => {
      ids
        .map((id) => window.roamAlphaAPI.pull("[:block/uid]", id)[":block/uid"])
        .map(cleanConfig);
    },
  });
});
