import { createConfigObserver } from "roamjs-components";
import { getDropUidOffset, runExtension } from "../entry-helpers";
import DropboxLogo from "../assets/Dropbox.svg";
import axios from "axios";
import {
  createBlock,
  createHTMLObserver,
  getTreeByPageName,
  updateBlock,
} from "roam-client";
import { Dropbox } from "dropbox";

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

  createHTMLObserver({
    tag: "DIV",
    className: "dnd-drop-area",
    callback: (d: HTMLDivElement) => {
      d.addEventListener("drop", (e) => {
        const fileToUpload = e.dataTransfer.files[0];
        if (fileToUpload) {
          const oauth = getTreeByPageName(CONFIG).find((t) =>
            /oauth/i.test(t.text)
          )?.children?.[0]?.text;
          if (oauth) {
            const { access_token } = JSON.parse(oauth);
            const dbx = new Dropbox({ accessToken: access_token });
            const { parentUid, offset } = getDropUidOffset(d);
            const uid = createBlock({
              parentUid,
              order: offset,
              node: { text: "Loading..." },
            });
            const reader = new FileReader();

            reader.readAsBinaryString(fileToUpload);

            reader.onloadend = () =>
              dbx
                .filesUpload({
                  path: `/${fileToUpload.name}`,
                  contents: fileToUpload,
                  autorename: true,
                })
                .then((r) =>
                  dbx
                    .sharingListSharedLinks({ path: r.result.path_display })
                    .then((l) =>
                      l.result.links.length
                        ? l.result.links[0].url
                        : dbx
                            .sharingCreateSharedLinkWithSettings({
                              path: r.result.path_display,
                              settings: {
                                requested_visibility: { ".tag": "public" },
                              },
                            })
                            .then((c) => c.result.url)
                    )
                )
                .then((r) => {
                  const url = r.replace(/dl=0$/, "raw=1");
                  updateBlock({
                    uid,
                    text: `![](${url})`,
                  });
                })
                .catch((e) => {
                  updateBlock({
                    uid,
                    text:
                      "Failed to upload file to dropbox. Email support@roamjs.com with the error below:",
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
      });
    },
  });
});
