import { createConfigObserver } from "roamjs-components/components/ConfigPage";
import getOauth from "roamjs-components/util/getOauth";
import { getDropUidOffset, runExtension } from "../entry-helpers";
import DropboxLogo from "../assets/Dropbox.svg";
import axios from "axios";
import { Dropbox } from "dropbox";
import mime from "mime-types";
import differenceInSeconds from "date-fns/differenceInSeconds";
import createBlock from "roamjs-components/writes/createBlock";
import updateBlock from "roamjs-components/writes/updateBlock";
import getUids from "roamjs-components/dom/getUids";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import localStorageGet from "roamjs-components/util/localStorageGet";
import localStorageSet from "roamjs-components/util/localStorageSet";

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
                    )}&response_type=code&token_access_type=offline`
                  ),
                getAuthData: (data) =>
                  axios
                    .post(`https://lambda.roamjs.com/dropbox-auth`, {
                      ...JSON.parse(data),
                      grant_type: "authorization_code",
                      redirect_uri: "https://roamjs.com/oauth?auth=true",
                    })
                    .then((r) => r.data),
              },
            },
          ],
        },
      ],
      versioning: true,
    },
  });

  const getAccessToken = () => {
    const oauth = getOauth(ID);
    if (oauth !== "{}") {
      const { access_token, expires_in, refresh_token, node, ...rest } =
        JSON.parse(oauth);
      const { time, uid: oauthUid } = node || {};
      const tokenAge = differenceInSeconds(
        new Date(),
        time ? new Date(time) : new Date(0)
      );
      return tokenAge > expires_in
        ? axios
            .post(`https://lambda.roamjs.com/dropbox-auth`, {
              refresh_token,
              grant_type: "refresh_token",
            })
            .then((r) => {
              if (!r.data.access_token) {
                return Promise.reject(
                  `Did not find an access token. Found: ${JSON.stringify(
                    r.data
                  )}`
                );
              }
              const storageData = localStorageGet("oauth-dropbox");
              const data = JSON.stringify({
                refresh_token,
                ...rest,
                ...r.data,
              });
              if (storageData) {
                localStorageSet(
                  "oauth-google",
                  JSON.stringify(
                    JSON.parse(storageData).map(
                      (at: { uid: string; text: string }) =>
                        at.uid === oauthUid
                          ? {
                              uid: at.uid,
                              data,
                              time: new Date().valueOf(),
                              text: at.text,
                            }
                          : at
                    )
                  )
                );
              } else {
                window.roamAlphaAPI.updateBlock({
                  block: {
                    uid: oauthUid,
                    string: data,
                  },
                });
              }
              return r.data.access_token;
            })
            .catch((e) =>
              Promise.reject(
                `Failed to refresh your access token: ${
                  e.response.data || e.message
                }`
              )
            )
        : Promise.resolve(access_token);
    } else {
      return Promise.reject(
        "Could not find your login info. Try first logging in through the [[roam/js/dropbox]] page"
      );
    }
  };

  const uploadToDropbox = ({
    files,
    getLoadingUid,
    e,
  }: {
    files: FileList;
    getLoadingUid: () => Promise<string>;
    e: Event;
  }) => {
    const fileToUpload = files[0];
    if (fileToUpload) {
      getLoadingUid().then((uid) => {
        const catchError = (e: unknown) => {
          updateBlock({
            uid,
            text: "Failed to upload file to dropbox. Email support@roamjs.com with the error below:",
          });
          createBlock({
            parentUid: uid,
            node: { text: JSON.stringify(e) },
          });
        };
        return getAccessToken()
          .then(async (access_token) => {
            const dbx = new Dropbox({ accessToken: access_token });
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
                    text: contentType
                      ? contentType.includes("audio/")
                        ? `{{audio: ${dbxUrl}}}`
                        : contentType.includes("pdf")
                        ? `{{pdf: ${dbxUrl}}}`
                        : contentType.includes("video/")
                        ? `{{video: ${dbxUrl}}}`
                        : `![](${dbxUrl})`
                      : `Unknown Content type for file ${fileToUpload.name}`,
                  });
                })
                .catch(catchError)
                .finally(() => {
                  Array.from(document.getElementsByClassName("dnd-drop-bar"))
                    .map((c) => c as HTMLDivElement)
                    .forEach((c) => (c.style.display = "none"));
                });
          })
          .catch(catchError);
      });
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
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
        true
      );
    }
  });
});
