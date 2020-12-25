import { runExtension } from "../entry-helpers";

const PREFIX = "{{GIPHY:";
const SUFFIX = "}}";

runExtension("giphy", () => {
  document.addEventListener("input", (e: InputEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA") {
      const textarea = target as HTMLTextAreaElement;
      const match = textarea.value.match(
        new RegExp(`${PREFIX}(.*)${SUFFIX}`, "s")
      );
      if (match) {
        const { index } = match;
        const full = match[0];
        const cursorPosition = textarea.selectionStart;
        if (
          cursorPosition > index + PREFIX.length &&
          cursorPosition <= index + full.length - SUFFIX.length
        ) {
          const capture = match[1];
          console.log("Search GIPHY for", capture);
        }
      }
    }
  });
});
