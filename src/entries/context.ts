import getBlockUidFromTarget from "roamjs-components/dom/getBlockUidFromTarget";
import getPageTitleByBlockUid from "roamjs-components/queries/getPageTitleByBlockUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import getParentUidByBlockUid from "roamjs-components/queries/getParentUidByBlockUid";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import runExtension from "roamjs-components/util/runExtension";
import openBlockInSidebar from "roamjs-components/writes/openBlockInSidebar";
import createHashtagObserver from "roamjs-components/dom/createHashtagObserver";
import { getParseRoamMarked } from "../entry-helpers";

const ID = "context";

let parseRoamMarked: Awaited<ReturnType<typeof getParseRoamMarked>>;
getParseRoamMarked().then((f) => (parseRoamMarked = f));
runExtension({
  extensionId: ID,
  run: () => {
    createHashtagObserver({
      attribute: "data-roamjs-context-parent",
      callback: (s) => {
        if (s.getAttribute("data-tag") === "parent") {
          const uid = getBlockUidFromTarget(s);
          const parentUid = getParentUidByBlockUid(uid);
          const parentText = getTextByBlockUid(parentUid);
          s.className = "rm-block-ref dont-focus-block";
          s.style.userSelect = "none";
          s.innerHTML = parseRoamMarked(parentText);
          s.onmousedown = (e) => e.stopPropagation();
          s.onclick = (e) => {
            if (e.shiftKey) {
              openBlockInSidebar(parentUid);
            } else {
              window.roamAlphaAPI.ui.mainWindow.openBlock({
                block: { uid: parentUid },
              });
            }
          };
        }
      },
    });

    createHashtagObserver({
      attribute: "data-roamjs-context-page",
      callback: (s) => {
        if (s.getAttribute("data-tag") === "page") {
          const uid = getBlockUidFromTarget(s);
          const page = getPageTitleByBlockUid(uid);
          s.className = "";
          const leftBracket = document.createElement("span");
          leftBracket.className = "rm-page-ref__brackets";
          leftBracket.innerText = "[[";
          const pageRef = document.createElement("span");
          pageRef.tabIndex = -1;
          pageRef.className = "rm-page-ref rm-page-ref--link";
          pageRef.innerText = page;
          const rightBracket = document.createElement("span");
          rightBracket.className = "rm-page-ref__brackets";
          rightBracket.innerText = "]]";
          s.innerHTML = "";
          s.style.userSelect = "none";
          s.appendChild(leftBracket);
          s.appendChild(pageRef);
          s.appendChild(rightBracket);
          s.onmousedown = (e) => e.stopPropagation();
          s.onclick = (e) => {
            const uid = getPageUidByPageTitle(page);
            if (e.shiftKey) {
              openBlockInSidebar(uid);
            } else {
              window.roamAlphaAPI.ui.mainWindow.openPage({ page: { uid } });
            }
          };
        }
      },
    });
  },
});
