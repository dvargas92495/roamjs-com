import { renderWYSIWYGMode } from "../components/WYSIWYGMode";

const toggleWysiwyg = (textarea: HTMLTextAreaElement) => {
  const parent = textarea.parentElement;
  const display = textarea.style.display;
  textarea.style.display = "none";
  const reactRoot = document.createElement("div");
  reactRoot.id = `roamjs-wysiwyg-root-${textarea.id}`;
  parent.appendChild(reactRoot);
  renderWYSIWYGMode(reactRoot, textarea, async () => {
    textarea.style.display = display;
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "w" && e.altKey) {
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA") {
      const textarea = target as HTMLTextAreaElement;
      toggleWysiwyg(textarea);
      e.stopImmediatePropagation();
    }
  }
});

document.addEventListener("mousedown", (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (
    e.altKey &&
    target.tagName === "div" &&
    target.className.indexOf("roam-block") > -1
  ) {
    const blockId = target.id;
    const findText = (n: Node) => (n as HTMLElement).id === blockId && n.nodeName === 'TEXTAREA';
    const observer = new MutationObserver((records, o) => {
      const record = records.find(r => Array.from(r.addedNodes).findIndex(findText))
      if (record) {
        const textarea = Array.from(record.addedNodes).find(findText);
        if (textarea) {
          toggleWysiwyg(textarea as HTMLTextAreaElement);
          o.disconnect();
        }
      }
    });
    observer.observe(target.parentElement, { childList: true, subtree: true });
  }
});
