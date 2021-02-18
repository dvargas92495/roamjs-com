import axios from "axios";
import { createHTMLObserver, runExtension } from "../entry-helpers";

runExtension("video", () => {
  createHTMLObserver({
    callback: (d: HTMLDivElement) => {
      const img = d.getElementsByTagName("img")[0];
      const src = img.src;
      axios
        .get(src, { responseType: "blob" })
        .then((r) => r.data as Blob)
        .then((b) => {
          if (b.type.startsWith("video")) {
            const video = document.createElement("video");
            video.controls = true;
            video.src = src;
            img.parentElement.insertBefore(video, img);
            img.remove();
          }
        });
    },
    tag: "DIV",
    className: "rm-inline-img__resize",
  });
});
