import { getTreeByPageName, getUids } from "roam-client";
import { render } from "../components/PostmanOverlay";
import { createHashtagObserver, extractTag, runExtension } from "../entry-helpers";

const APIS_REGEX = /apis/i;

runExtension("postman", () => {
    createHashtagObserver({
        attribute: 'data-roamjs-postman',
        callback: (s: HTMLSpanElement) => {
            const tree = getTreeByPageName('roam/js/postman');
            const tag = s.getAttribute('data-tag');
            const apis = tree.find(t => APIS_REGEX.test(t.text)).children;
            const api = apis.find(a => tag.toUpperCase() === extractTag(a.text.trim()))
            if (api) {
                const { blockUid } = getUids(
                  s.closest(".roam-block") as HTMLDivElement
                );
                const p = document.createElement('span');
                p.style.verticalAlign = "middle";
                p.onmousedown = (e: MouseEvent) => e.stopPropagation();
                s.appendChild(p);
                render({
                    p,
                    apiUid: api.uid,
                    blockUid,
                })
            }
        }
    })
});
