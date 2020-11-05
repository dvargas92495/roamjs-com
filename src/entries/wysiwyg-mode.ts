import { renderWYSIWYGMode } from "../components/WYSIWYGMode";

document.addEventListener("keydown", (e) => {
  if (e.key === "w" && e.altKey) {
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA") {
      const textarea = target as HTMLTextAreaElement;
      const parent = textarea.parentElement;
      const display = textarea.style.display;
      textarea.style.display = "none";
      const reactRoot = document.createElement("div");
      reactRoot.id = `roamjs-wysiwyg-root-${textarea.id}`;
      parent.appendChild(reactRoot);
      renderWYSIWYGMode(reactRoot, textarea.value, (output) => {
        textarea.style.display = display;
        textarea.value = output;
      });
      e.stopImmediatePropagation();
    }
  }
});
