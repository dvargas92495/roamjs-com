import {
  createPageTitleObserver,
  getPageUidByPageTitle,
  getRoamUrl,
} from "../entry-helpers";
import { createPage, PullBlock } from "roam-client";
import { render } from "../components/StaticSiteDashboard";

const title = "roam/js/static-site";

createPageTitleObserver({
  title,
  callback: (d: HTMLDivElement) => {
    const parent = document.createElement("div");
    parent.id = "roamjs-static-site-dashboard";
    d.firstElementChild.insertBefore(
      parent,
      d.firstElementChild.firstElementChild.nextElementSibling
    );
    render(parent);
  },
});

if (!getPageUidByPageTitle(title)) {
  const watchCallback = (before: PullBlock, after: PullBlock) => {
    if (before === null) {
      window.location.assign(getRoamUrl(after[":block/uid"]));
      window.roamAlphaAPI.data.removePullWatch(
        "[*]",
        `[:node/title "${title}"]`,
        watchCallback
      );
    }
  };

  window.roamAlphaAPI.data.addPullWatch(
    "[*]",
    `[:node/title "${title}"]`,
    watchCallback
  );
  createPage({
    title,
    tree: [
      {
        text: "token",
        children: [],
      },
    ],
  });
}
