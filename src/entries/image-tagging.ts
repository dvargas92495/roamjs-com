import Tesseract from 'tesseract.js';

document.addEventListener("dblclick", (e) => {
    const htmlTarget = e.target as HTMLElement;
    if (htmlTarget && htmlTarget.tagName === 'IMG') {
        const img = htmlTarget as HTMLImageElement;
        Tesseract.recognize(img.src, 'eng').then(({ data: {text}}) => {
            console.log(text);
        })
    }
});
