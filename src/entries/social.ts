import { PullBlock, createPage } from "roam-client";
import { render } from "../components/SocialDashboard";
import { createPageTitleObserver, getPageUidByPageTitle, getRoamUrl } from "../entry-helpers";

const title = "roam/js/social";

createPageTitleObserver({
  title,
  callback: (d: HTMLDivElement) => {
    const parent = document.createElement("div");
    parent.id = "roamjs-social-dashboard";
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
