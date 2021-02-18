import { generateBlockUid, getTreeByPageName, getUids } from "roam-client";
import { render } from "../components/PostmanOverlay";
import {
  createHashtagObserver,
  extractTag,
  getPageUidByPageTitle,
  runExtension,
} from "../entry-helpers";

const APIS_REGEX = /apis/i;

runExtension("postman", () => {
  if (!getPageUidByPageTitle("roam/js/postman")) {
    const uid = generateBlockUid();
    window.roamAlphaAPI.createPage({ page: { title: "roam/js/postman", uid } });
    const apiUid = generateBlockUid();
    window.roamAlphaAPI.createBlock({
      location: { "parent-uid": uid, order: 0 },
      block: { uid: apiUid, string: "apis" },
    });
    const exampleUid = generateBlockUid();
    window.roamAlphaAPI.createBlock({
      location: { "parent-uid": apiUid, order: 0 },
      block: { uid: exampleUid, string: "PostmanExample" },
    });
    const urlUid = generateBlockUid();
    window.roamAlphaAPI.createBlock({
      location: { "parent-uid": exampleUid, order: 0 },
      block: { uid: urlUid, string: "url" },
    });
    window.roamAlphaAPI.createBlock({
      location: { "parent-uid": urlUid, order: 0 },
      block: { string: "https://deckofcardsapi.com/api/deck/new/shuffle" },
    });
    const bodyUid = generateBlockUid();
    window.roamAlphaAPI.createBlock({
      location: { "parent-uid": exampleUid, order: 1 },
      block: { uid: bodyUid, string: "body" },
    });
    const dcUid = generateBlockUid();
    window.roamAlphaAPI.createBlock({
      location: { "parent-uid": bodyUid, order: 0 },
      block: { uid: dcUid, string: "deck_count" },
    });
    window.roamAlphaAPI.createBlock({
      location: { "parent-uid": dcUid, order: 0 },
      block: { string: "1" },
    });
    const bcUid = generateBlockUid();
    window.roamAlphaAPI.createBlock({
      location: { "parent-uid": bodyUid, order: 1 },
      block: { uid: bcUid, string: "body_content" },
    });
    window.roamAlphaAPI.createBlock({
      location: { "parent-uid": bcUid, order: 0 },
      block: { string: "Contents: {block}" },
    });
    const headerUid = generateBlockUid();
    window.roamAlphaAPI.createBlock({
      location: { "parent-uid": exampleUid, order: 2 },
      block: { uid: headerUid, string: "headers" },
    });
    const ctUid = generateBlockUid();
    window.roamAlphaAPI.createBlock({
      location: { "parent-uid": headerUid, order: 0 },
      block: { uid: ctUid, string: "Content-Type" },
    });
    window.roamAlphaAPI.createBlock({
      location: { "parent-uid": headerUid, order: 0 },
      block: { string: "application/json" },
    });
  }
  createHashtagObserver({
    attribute: "data-roamjs-postman",
    callback: (s: HTMLSpanElement) => {
      const tree = getTreeByPageName("roam/js/postman");
      const tag = s.getAttribute("data-tag");
      const apis = tree.find((t) => APIS_REGEX.test(t.text)).children;
      const api = apis.find(
        (a) => tag.toUpperCase() === extractTag(a.text.trim())
      );
      if (api) {
        const { blockUid } = getUids(
          s.closest(".roam-block") as HTMLDivElement
        );
        const p = document.createElement("span");
        p.style.verticalAlign = "middle";
        p.onmousedown = (e: MouseEvent) => e.stopPropagation();
        s.appendChild(p);
        render({
          p,
          apiUid: api.uid,
          blockUid,
        });
      }
    },
  });
});
