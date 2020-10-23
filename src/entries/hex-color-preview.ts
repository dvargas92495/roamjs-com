import { createBlockObserver, getRefTitlesByBlockUid } from "../entry-helpers";
import { getUids } from "roam-client";
import Color from "color";

const HEX_COLOR_PREVIEW_CLASSNAME = "roamjs-hex-color-preview";
const css = document.createElement("style");
css.textContent = `.${HEX_COLOR_PREVIEW_CLASSNAME} {
    width: 16px;
    height: 16px;
    display: inline-block;
    margin-left: 4px;
    top: 3px;
    position: relative;
}`;
document.getElementsByTagName("head")[0].appendChild(css);

const renderColorPreviewsInBlock = (block: HTMLDivElement) => {
  const { blockUid } = getUids(block);
  const refs = getRefTitlesByBlockUid(blockUid);
  const renderedRefs = Array.from(
    block.getElementsByClassName("rm-page-ref-tag")
  );
  refs.forEach((r) => {
    try {
      const c = Color(`#${r}`);
      const previewIdPrefix = `hex-color-preview-${blockUid}-${r}-`;
      const renderedRefSpans = renderedRefs.filter(
        (s) =>
          s.getAttribute("data-tag") === r &&
          (!s.lastElementChild ||
            !s.lastElementChild.id.startsWith(previewIdPrefix))
      );
      renderedRefSpans.forEach((renderedRef, i) => {
        const newSpan = document.createElement("span");
        newSpan.style.backgroundColor = c.string();
        newSpan.className = HEX_COLOR_PREVIEW_CLASSNAME;
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
};

createBlockObserver(renderColorPreviewsInBlock);
