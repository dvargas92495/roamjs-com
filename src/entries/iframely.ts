import axios from "axios";
import {
  createButtonObserver,
  getTextByBlockUid,
  getUidsFromButton,
} from "roam-client";
import { runExtension } from "../entry-helpers";

const ID = "iframely";
const REGEX = /^https?:\/\//i;

runExtension(ID, () => {
  createButtonObserver({
    shortcut: "iframely",
    attribute: "iframely",
    render: (b) => {
      const { blockUid } = getUidsFromButton(b);
      const text = getTextByBlockUid(blockUid);
      const inputUrl = /{{(?:\[\[)?iframely(?:\]\])?:(.*?)}}/.exec(text)?.[1];
      if (inputUrl) {
        const url = REGEX.test(inputUrl) ? inputUrl : `https://${inputUrl}`;
        return axios
          .post(`${process.env.REST_API_URL}/iframely`, { url })
          .then((r) => {
            const { html } = r.data;
            const children = new DOMParser().parseFromString(html, "text/html")
              .body.children;
            const parent = b.parentElement;
            Array.from(parent.children).forEach((c) => parent.removeChild(c));
            Array.from(children).forEach((c) => {
              if (c.tagName === "SCRIPT") {
                const oldScript = c as HTMLScriptElement;
                const script = document.createElement("script");
                script.src = oldScript.src;
                script.async = oldScript.async;
                script.type = "text/javascript";
                parent.appendChild(script);
              } else {
                parent.appendChild(c);
              }
            });
          });
      }
    },
  });
});
