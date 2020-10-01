document.addEventListener("dblclick", (e) => {
    const htmlTarget = e.target as HTMLElement;
    if (htmlTarget && htmlTarget.tagName === 'IMG') {
        console.log("nice");
    }
});
