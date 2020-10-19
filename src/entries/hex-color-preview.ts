import {
  createObserver,
  getRefTitlesByBlockUid,
  getUids,
} from "../entry-helpers";
import Color from "color";

const renderColorPreviewsInBlock = (block: HTMLDivElement) => {
  const { blockUid } = getUids(block);
    const refs = getRefTitlesByBlockUid(blockUid);
    const renderedRefs = Array.from(
      block.getElementsByClassName("rm-page-ref-tag")
    );
    refs.forEach((r) => {
      try {
        const c = Color(`#${r}`);
        const previewIdPrefix = `hex-code-preview-${blockUid}-${r}-`;
        const renderedRefSpans = renderedRefs.filter(
          (s) => s.getAttribute("data-tag") === r && !s.lastElementChild.id.startsWith(previewIdPrefix)
        );
        renderedRefSpans.forEach((renderedRef, i) => {
          const newSpan = document.createElement("span");
          newSpan.style.backgroundColor = c.hex();
          newSpan.style.width = "16px";
          newSpan.style.height = "16px";
          newSpan.style.display = 'inline-block';
          newSpan.style.marginLeft = '4px';
          newSpan.style.top = '3px';
          newSpan.style.position = 'relative';
          newSpan.id = `${previewIdPrefix}${i}`;
          renderedRef.appendChild(newSpan);
        });
      } catch (e) {
        if (
          !e.message ||
          !e.message.startsWith("Unable to parse color from string")
        ) {
          throw e;
        }
      }
    });
}

const blocks = document.getElementsByClassName('roam-block');
Array.from(blocks).forEach(renderColorPreviewsInBlock);

createObserver((ms) => {
  const record = ms.find(
    (m) =>
      !!Array.from(m.addedNodes).find(
        (d) =>
          d.nodeName === "DIV" &&
          Array.from((d as HTMLDivElement).classList).indexOf("roam-block") > -1
      )
  );
  if (record) {
    const block = record.addedNodes[0] as HTMLDivElement;
    renderColorPreviewsInBlock(block);
  }
});
