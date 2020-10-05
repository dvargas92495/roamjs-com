import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { createWorker } from "tesseract.js";
import { getConfigFromPage, newBlockEnter } from "../entry-helpers";

const config = getConfigFromPage('roam/js/image-tagging');
const events = {
  "DOUBLE CLICK": "dblclick",
  "SHIFT CLICK": "click"
};
const trigger = config["Trigger"]?.toUpperCase() as keyof typeof events;
const event = trigger ? events[trigger] : "dblclick";

document.addEventListener(event, async (e: MouseEvent) => {
  const htmlTarget = e.target as HTMLElement;
  if (htmlTarget && htmlTarget.tagName === "IMG" && (trigger != "SHIFT CLICK" && e.shiftKey)) {
    const img = htmlTarget as HTMLImageElement;
    const imgContainer = img.closest('.hoverparent')
    const editButton = imgContainer.getElementsByClassName('bp3-icon-edit')[0];
    await userEvent.click(editButton);
    await waitFor(() => {
      if (document.activeElement.tagName !== 'TEXTAREA') {
        throw new Error("Textarea didn't render");
      }
    })
    await newBlockEnter();
    await userEvent.tab();
    await userEvent.type(document.activeElement, "Loading...");

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
      await userEvent.clear(document.activeElement);
      await userEvent.type(document.activeElement, text);
    };
  }
});
