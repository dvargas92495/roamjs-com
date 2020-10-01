import { createWorker } from "tesseract.js";

const worker = createWorker();

document.addEventListener("dblclick", (e) => {
  const htmlTarget = e.target as HTMLElement;
  if (htmlTarget && htmlTarget.tagName === "IMG") {
    const img = htmlTarget as HTMLImageElement;

    const tesseractImage = document.createElement("img");
    tesseractImage.src = img.src;
    tesseractImage.crossOrigin = "Anonymous";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    tesseractImage.onload = async () => {
      canvas.width = tesseractImage.width;
      canvas.height = tesseractImage.height;
      ctx.drawImage(tesseractImage, 0, 0);
      await worker.load();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      const {
        data: { text },
      } = await worker.recognize(ctx);
      console.log(text);
      await worker.terminate();
    };
  }
});
