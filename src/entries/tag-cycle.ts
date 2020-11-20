import {
  getTextTreeByPageName,
  isControl,
  replaceTagText,
} from "../entry-helpers";

getTextTreeByPageName("roam/js/tag-cycle")
  .filter(
    (t) =>
      t.text.toUpperCase().startsWith("CTRL+") ||
      t.text.toUpperCase().startsWith("CMD+") ||
      t.text.toUpperCase().startsWith("ALT+") ||
      t.text.toUpperCase().startsWith("WIN+")
  )
  .forEach((shortcut) => {
    const parts = shortcut.text.split("+").map((s) => s.toUpperCase().trim());
    const modifier = parts[0];
    const isShift = parts[1] === "SHIFT";
    const key = parts[parts.length - 1] || "";
    const cycle = shortcut.children.map((c) => c.text.trim());
    const sortedCycle = cycle
      .map((tag, index) => ({ tag, index }))
      .sort((a, b) => b.tag.length - a.tag.length);
    const isTriggered = (e: KeyboardEvent) => {
      if (modifier === "ALT" && !e.altKey) {
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
      if (key !== e.key.toUpperCase()) {
        return false;
      }
      return true;
    };
    document.addEventListener("keydown", async (e: KeyboardEvent) => {
      const element = document.activeElement as HTMLElement;
      if (element.tagName === "TEXTAREA") {
        if (isTriggered(e)) {
          const textarea = element as HTMLTextAreaElement;
          for (let i = 0; i < sortedCycle.length; i++) {
            const { tag: tag1, index } = sortedCycle[i];
            if (
              textarea.value.includes(`#[[${tag1}]]`) ||
              textarea.value.includes(`[[${tag1}]]`) ||
              textarea.value.includes(`#${tag1}`) ||
              !tag1
            ) {
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const tag2 = cycle[(index + 1 + cycle.length) % cycle.length];
              await replaceTagText([tag1, tag2]);
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
    });
  });
