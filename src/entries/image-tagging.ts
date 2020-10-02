import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { createWorker } from "tesseract.js";
import { newBlockEnter } from "../entry-helpers";

document.addEventListener("dblclick", async (e) => {
  const htmlTarget = e.target as HTMLElement;
  if (htmlTarget && htmlTarget.tagName === "IMG") {
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
    await userEvent.type(document.activeElement, '{tab}');
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
