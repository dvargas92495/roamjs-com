import { createConfigObserver } from "roamjs-components";
import { getDropUidOffset, runExtension } from "../entry-helpers";
import DropboxLogo from "../assets/Dropbox.svg";
import axios from "axios";
import {
  createBlock,
  createHTMLObserver,
  getTreeByPageName,
  getUids,
  updateBlock,
} from "roam-client";
import { Dropbox } from "dropbox";
import { getOauth } from "../components/hooks";
import mime from "mime-types";

const ID = "dropbox";
const CONFIG = `roam/js/${ID}`;

runExtension(ID, () => {
  createConfigObserver({
    title: CONFIG,
    config: {
      tabs: [
        {
          id: "home",
          fields: [
            {
              type: "oauth",
              title: "oauth",
              description: "Sign in to your Dropbox account below",
              options: {
                service: "dropbox",
                ServiceIcon: DropboxLogo,
                getPopoutUrl: () =>
                  Promise.resolve(
                    `https://www.dropbox.com/oauth2/authorize?client_id=${
                      process.env.DROPBOX_CLIENT_ID
                    }&redirect_uri=${encodeURIComponent(
                      "https://roamjs.com/oauth?auth=true"
                    )}&response_type=code`
                  ),
                getAuthData: (data) =>
                  axios
                    .post(
                      `${process.env.REST_API_URL}/dropbox-auth`,
                      JSON.parse(data)
                    )
                    .then((r) => r.data),
              },
            },
          ],
        },
      ],
    },
  });

  const uploadToDropbox = ({
    files,
    getLoadingUid,
    e,
  }: {
    files: FileList;
    getLoadingUid: () => string;
    e: Event;
  }) => {
    const fileToUpload = files[0];
    if (fileToUpload) {
      const oauth = getOauth(getTreeByPageName(CONFIG));
      if (oauth !== "{}") {
        const { access_token } = JSON.parse(oauth);
        const dbx = new Dropbox({ accessToken: access_token });
        const uid = getLoadingUid();
        const reader = new FileReader();

        reader.readAsBinaryString(fileToUpload);

        reader.onloadend = () =>
          dbx
            .filesUpload({
              path: `/${fileToUpload.name}`,
              contents: fileToUpload,
              autorename: true,
            })
            .then((r) => {
              const contentType = mime.lookup(r.result.name);
              return dbx
                .sharingListSharedLinks({ path: r.result.path_display })
                .then((l) =>
                  l.result.links.length
                    ? { contentType, url: l.result.links[0].url }
                    : dbx
                        .sharingCreateSharedLinkWithSettings({
                          path: r.result.path_display,
                          settings: {
                            requested_visibility: { ".tag": "public" },
                          },
                        })
                        .then((c) => ({ url: c.result.url, contentType }))
                );
            })
            .then(({ url, contentType }) => {
              const dbxUrl = url.replace(/dl=0$/, "raw=1");
              updateBlock({
                uid,
                text:
                  contentType && contentType.includes("pdf")
                    ? `{{pdf: ${dbxUrl}}}`
                    : `![](${dbxUrl})`,
              });
            })
            .catch((e) => {
              updateBlock({
                uid,
                text: "Failed to upload file to dropbox. Email support@roamjs.com with the error below:",
              });
              createBlock({
                parentUid: uid,
                node: { text: JSON.stringify(e) },
              });
            })
            .finally(() => {
              Array.from(document.getElementsByClassName("dnd-drop-bar"))
                .map((c) => c as HTMLDivElement)
                .forEach((c) => (c.style.display = "none"));
            });
        e.stopPropagation();
        e.preventDefault();
      }
    }
  };

  createHTMLObserver({
    tag: "DIV",
    className: "dnd-drop-area",
    callback: (d: HTMLDivElement) => {
      d.addEventListener("drop", (e) => {
        uploadToDropbox({
          files: e.dataTransfer.files,
          getLoadingUid: () => {
            const { parentUid, offset } = getDropUidOffset(d);
            return createBlock({
              parentUid,
              order: offset,
              node: { text: "Loading..." },
            });
          },
          e,
        });
      });
    },
  });

  const textareaRef: { current: HTMLTextAreaElement } = {
    current: null,
  };

  createHTMLObserver({
    tag: "TEXTAREA",
    className: "rm-block-input",
    callback: (t: HTMLTextAreaElement) => {
      textareaRef.current = t;
      t.addEventListener("paste", (e) => {
        uploadToDropbox({
          files: e.clipboardData.files,
          getLoadingUid: () => {
            const { blockUid } = getUids(t);
            return updateBlock({
              text: "Loading...",
              uid: blockUid,
            });
          },
          e,
        });
      });
    },
  });

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLInputElement;
    if (
      target.tagName === "INPUT" &&
      target.parentElement === document.body &&
      target.type === "file"
    ) {
      target.addEventListener(
        "change",
        (e) => {
          uploadToDropbox({
            files: (e.target as HTMLInputElement).files,
            getLoadingUid: () => {
              const { blockUid } = getUids(textareaRef.current);
              return updateBlock({
                text: "Loading...",
                uid: blockUid,
              });
            },
            e,
          });
        },
        { capture: true }
      );
    }
  });
});
