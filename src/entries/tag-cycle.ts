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
  .forEach((shortcut) =>
    document.addEventListener("keydown", async (e: KeyboardEvent) => {
      const element = document.activeElement as HTMLElement;
      if (element.tagName === "TEXTAREA") {
        if (isControl(e)) {
          const rest = shortcut.text.split("+").slice(1);
          const key = rest[0];
          if (e.key === key) {
            const cycle = shortcut.children.map((c) => c.text.trim());
            const textarea = element as HTMLTextAreaElement;
            const oldvalue = textarea.value;
            const cycleTags = async (i: number) => {
              const tag1 = cycle[i];
              if (textarea.value.includes(tag1)) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const tag2 = cycle[(i + 1 + cycle.length) % cycle.length];
                await replaceTagText([tag1, tag2]);
                textarea.setSelectionRange(
                  start - tag1.length + tag2.length,
                  end - tag1.length + tag2.length
                );
                e.preventDefault();
                e.stopPropagation();
                return true;
              }
              return false;
            };
            for (let i = 0; i < cycle.length; i++) {
              if (!cycle[i]) {
                continue;
              }
              if (cycleTags(i)) {
                  break;
              }
            }
            if (oldvalue === textarea.value) {
                const emptyIndex = cycle.indexOf("");
                cycleTags(emptyIndex);
            }
          }
        }
      }
    })
  );
