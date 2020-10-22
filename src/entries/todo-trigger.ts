document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (
    target.tagName === "INPUT" &&
    target.parentElement.className === "check-container"
  ) {
    const inputTarget = target as HTMLInputElement;
    if (inputTarget.type === "checkbox") {
        console.log(inputTarget.checked);
    }
  }
});

// What a ridiculous hack
export {}
