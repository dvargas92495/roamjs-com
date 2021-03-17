import axios from "axios";
import { getUids } from "roam-client";
import { render } from "../components/YoutubePlayer";
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
            video.width = 580;
            img.parentElement.insertBefore(video, img);
            img.remove();
          }
        });
    },
    tag: "DIV",
    className: "rm-inline-img__resize",
  });

  createHTMLObserver({
    tag: "IFRAME",
    className: "rm-video-player",
    callback: (iframe: HTMLIFrameElement) => {
      const youtubeId = /youtube\.com\/embed\/(.*?)(\?|$)/.exec(
        iframe.src
      )?.[1];
      if (youtubeId) {
        const { blockUid } = getUids(
          iframe.closest(".roam-block") as HTMLDivElement
        );
        render({
          p: iframe.parentElement as HTMLDivElement,
          blockUid,
          youtubeId,
        });
      }
    },
  });
});
