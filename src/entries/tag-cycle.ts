import {
  getTextTreeByPageName,
  isControl,
  replaceTagText,
} from "../entry-helpers";

getTextTreeByPageName("roam/js/tag-cycle")
  .filter(
    (t) =>
      t.text.toUpperCase().startsWith("CTRL+") ||
      t.text.toUpperCase().startsWith("CMD+")
  )
  .forEach((shortcut) => {
    const rest = shortcut.text.split("+").slice(1);
    const key = rest[0];
    const cycle = shortcut.children.map((c) => c.text.trim());
    const sortedCycle = cycle
      .map((tag, index) => ({ tag, index }))
      .sort((a, b) => b.tag.length - a.tag.length);
    document.addEventListener("keydown", async (e: KeyboardEvent) => {
      const element = document.activeElement as HTMLElement;
      if (element.tagName === "TEXTAREA") {
        if (isControl(e)) {
          if (e.key === key) {
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
      }
    })
});
