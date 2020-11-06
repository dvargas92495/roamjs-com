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
};

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
  if (e.altKey) {
    const target = (e.target as HTMLElement).closest(".roam-block");
    if (target?.tagName === "DIV") {
      const blockId = target.id;
      const findText = (n: Node) => {
        const ts = (n as HTMLElement).getElementsByTagName("textarea");
        return ts.length && ts[0].id === blockId;
      };
      const observer = new MutationObserver((records, o) => {
        const record = records.find((r) =>
          Array.from(r.addedNodes).findIndex(findText)
        );
        if (record) {
          const div = Array.from(record.addedNodes).find(findText) as HTMLElement;
          if (div) {
            const textarea = div.getElementsByTagName('textarea')[0];
            toggleWysiwyg(textarea as HTMLTextAreaElement);
            o.disconnect();
          }
        }
      });
      observer.observe(target.parentElement, {
        childList: true,
        subtree: true,
      });
    }
  }
});
