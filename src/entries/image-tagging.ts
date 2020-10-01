import Tesseract from 'tesseract.js';

document.addEventListener("dblclick", (e) => {
    const htmlTarget = e.target as HTMLElement;
    if (htmlTarget && htmlTarget.tagName === 'IMG') {
        const img = htmlTarget as HTMLImageElement;
        const tesseractImage = document.createElement('img');
        tesseractImage.src = img.src;
        tesseractImage.crossOrigin = 'Anonymous';
        Tesseract.recognize(tesseractImage, 'eng').then(({ data: {text}}) => {
            console.log(text);
        })
    }
});
