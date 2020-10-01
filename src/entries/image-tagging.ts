import Tesseract from "tesseract.js";

document.addEventListener("dblclick", (e) => {
  const htmlTarget = e.target as HTMLElement;
  if (htmlTarget && htmlTarget.tagName === "IMG") {
    const img = htmlTarget as HTMLImageElement;

    const tesseractImage = document.createElement("img");
    tesseractImage.src = img.src;
    tesseractImage.crossOrigin = "Anonymous";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    tesseractImage.onload = () => {
      canvas.width = tesseractImage.width;
      canvas.height = tesseractImage.height;
      ctx.drawImage(tesseractImage, 0, 0);
      Tesseract.recognize(ctx).then(({ data: { text } }) => {
        console.log(text);
      });
    };
  }
});
