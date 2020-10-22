const onTodo = () => {
    console.log("TODO!");
}

const onDone = () => {
    console.log("DONE!");
}

document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (
    target.tagName === "INPUT" &&
    target.parentElement.className === "check-container"
  ) {
    const inputTarget = target as HTMLInputElement;
    if (inputTarget.type === "checkbox") {
        if (inputTarget.checked) {
            onTodo();
        } else {
            onDone();
        }
    }
  }
});

// What a ridiculous hack
export {}
