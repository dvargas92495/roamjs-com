import { render } from "../components/MarkmapPanel";
import { createHTMLObserver, runExtension } from "../entry-helpers";

const li = document.createElement('li');

runExtension("markmap", () => {
  createHTMLObserver({
    callback: (u: HTMLUListElement) => {
      const lis = Array.from(u.getElementsByTagName("li")).map(
        (l: HTMLLIElement) => l.innerText
      );
      if (
        lis.includes("Open right sidebar") &&
        !u.getAttribute("data-roamjs-has-markmap")
      ) {
        u.setAttribute("data-roamjs-has-markmap", "true");
        u.appendChild(li);
        render(li);
      }
    },
    tag: "UL",
    className: "bp3-menu",
  });
});
