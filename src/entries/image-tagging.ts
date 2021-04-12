import { createWorker } from "tesseract.js";
import { runExtension } from "../entry-helpers";
import {
  createObserver,
  getFirstChildUidByBlockUid,
  getConfigFromPage,
  pushBullets,
  createIconButton,
  getUidsFromButton,
} from "roam-client";

runExtension("image-tagging", () => {
  const config = getConfigFromPage("roam/js/image-tagging");
  const events = {
    "DOUBLE CLICK": "dblclick",
    "SHIFT CLICK": "click",
    "ICON CLICK": "click",
  };
  const trigger =
    (config["Trigger"]?.toUpperCase() as keyof typeof events) || "ICON CLICK";
  const event = trigger ? events[trigger] : "dblclick";

  const clickCallback = async (htmlTarget: HTMLElement) => {
    const imgContainer = htmlTarget.closest(".hoverparent");
    const img = imgContainer.getElementsByTagName("img")[0];
    const editButton = imgContainer.getElementsByClassName(
      "bp3-icon-edit"
    )[0] as HTMLButtonElement;
    const { blockUid } = getUidsFromButton(editButton);
    window.roamAlphaAPI.createBlock({
      block: { string: "Loading..." },
      location: { "parent-uid": blockUid, order: 0 },
    });
    const loadingUid = await new Promise<string>((resolve) =>
      setTimeout(() => resolve(getFirstChildUidByBlockUid(blockUid)), 1)
    );

    const tesseractImage = document.createElement("img");
    tesseractImage.src = img.src;
    tesseractImage.crossOrigin = "Anonymous";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    tesseractImage.onload = async () => {
      canvas.width = tesseractImage.width;
      canvas.height = tesseractImage.height;
      ctx.drawImage(tesseractImage, 0, 0);
      const worker = createWorker();
      await worker.load();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      const {
        data: { text },
      } = await worker.recognize(canvas);
      await worker.terminate();
      const textBullets = text.split("\n");
      const bullets = [];
      let currentText = "";
      for (let b = 0; b < textBullets.length; b++) {
        const s = textBullets[b];
        if (s) {
          currentText += s;
        } else {
          bullets.push(
            currentText.startsWith("* ") ||
              currentText.startsWith("- ") ||
              currentText.startsWith("— ")
              ? currentText.substring(2)
              : currentText
          );
          currentText = "";
        }
      }
      await pushBullets(bullets, loadingUid, blockUid);
    };
  };

  if (trigger === "ICON CLICK") {
    createObserver(() => {
      const imgs = Array.from(document.getElementsByTagName("img"));
      imgs
        .filter((i) => i.className === "rm-inline-img")
        .forEach((img) => {
          const imgContainer = img.closest(".hoverparent");
          if (
            imgContainer.getElementsByClassName(
              "image-extraction-icon-container"
            ).length === 0
          ) {
            const button = createIconButton("search-text");
            button.onclick = (e: MouseEvent) => {
              clickCallback(e.target as HTMLElement);
              e.stopPropagation();
              e.preventDefault();
            };
            button.onmousedown = (e: MouseEvent) => {
              e.stopPropagation();
              e.preventDefault();
            };
            button.style.opacity = "0";
            const container = img.closest(".rm-inline-img__resize");
            if (container) {
              container.addEventListener(
                "mouseenter",
                () => (button.style.opacity = "1")
              );
              container.addEventListener(
                "mouseleave",
                () => (button.style.opacity = "0")
              );
            }

            const div = document.createElement("div");
            div.style.position = "absolute";
            div.style.right = "0px";
            div.style.top = "24px";
            div.style.zIndex = "10";
            div.className = "image-extraction-icon-container";
            div.appendChild(button);
            imgContainer.appendChild(div);
          }
        });
    });
  } else {
    document.addEventListener(event, (e: MouseEvent) => {
      const htmlTarget = e.target as HTMLElement;
      if (
        htmlTarget &&
        htmlTarget.tagName === "IMG" &&
        (trigger != "SHIFT CLICK" || e.shiftKey)
      ) {
        clickCallback(htmlTarget);
      }
    });
  }
});
