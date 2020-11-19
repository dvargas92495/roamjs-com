import {
  getTextTreeByPageName,
  isControl,
  replaceText,
} from "../entry-helpers";

const config = getTextTreeByPageName("roam/js/tag-cycle");
const shortcuts = config
  .filter(
    (t) =>
      t.text.toUpperCase().startsWith("CTRL+") ||
      t.text.toUpperCase().startsWith("CMD+")
  )
  .forEach((shortcut) =>
    document.addEventListener("keydown", async  (e: KeyboardEvent) => {
      const element = document.activeElement as HTMLElement;
      if (element.tagName === "TEXTAREA") {
        if (isControl(e)) {
          const rest = shortcut.text.split("+").slice(1);
          const key = rest[0];
          if (e.key === key) {
            const cycle = shortcut.children.map((c) => c.text);
            const textarea = element as HTMLTextAreaElement;
            for (let i = 0; i < cycle.length; i++) {
              const tag1 = cycle[i];
              if (textarea.value.includes(tag1)) {
                await replaceText([
                  tag1,
                  cycle[(i + 1 + cycle.length) % cycle.length],
                ]);
                break;
              }
            }
          }
        }
      }
    })
  );
