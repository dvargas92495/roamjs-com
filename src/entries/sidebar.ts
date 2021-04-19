import {
  createBlock,
  createHTMLObserver,
  createObserver,
  deleteBlock,
  getPageTitleByPageUid,
  getPageUidByPageTitle,
  getTreeByPageName,
} from "roam-client";
import {
  getCurrentPageUid,
  getRoamUrlByPage,
  isPopoverThePageFilter,
  runExtension,
} from "../entry-helpers";
import { render as iconRender } from "../components/MinimalIcon";
import { render as saveRender } from "../components/SaveSidebar";
import { createConfigObserver } from "roamjs-components";

const ID = "sidebar";
const CONFIG = `roam/js/${ID}`;

runExtension(ID, () => {
  createConfigObserver({
    title: CONFIG,
    config: {
      tabs: [],
    },
  });

  createObserver((_, observer) => {
    const rightSidebar = document.getElementById("right-sidebar");
    if (rightSidebar) {
      const rightSidebarTopbar = rightSidebar.getElementsByClassName(
        "bp3-icon-menu-open"
      )?.[0]?.parentElement?.parentElement?.firstElementChild as HTMLDivElement;
      if (rightSidebarTopbar) {
        const expandCollapseContainer = document.createElement("span");
        iconRender({
          p: expandCollapseContainer,
          icon: "collapse-all",
          toggleIcon: "expand-all",
          onClick: () => {
            window.roamAlphaAPI.ui.rightSidebar.getWindows().forEach((w) => {
              window.roamAlphaAPI.ui.rightSidebar.collapseWindow({
                window: {
                  type: w.type,
                  "block-uid": "",
                },
              });
            });
          },
          onToggleClick: () => {
            window.roamAlphaAPI.ui.rightSidebar.getWindows().forEach((w) => {
              window.roamAlphaAPI.ui.rightSidebar.expandWindow({
                window: {
                  type: w.type,
                  "block-uid": "",
                },
              });
            });
          },
        });
        rightSidebarTopbar.appendChild(expandCollapseContainer);

        const saveSidebarContainer = document.createElement("span");
        saveRender(saveSidebarContainer);
        rightSidebarTopbar.appendChild(saveSidebarContainer);
      }
      observer.disconnect();

      const sidebarStyleObserver = new MutationObserver(() => {
        const parentUid = getPageUidByPageTitle(CONFIG);
        const uid = getTreeByPageName(CONFIG).find((i) => /open/i.test(i.text))
          ?.uid;
        const isOpen = !!uid;
        const isCloseIconPresent = !!document.getElementsByClassName(
          "bp3-icon-menu-closed"
        ).length;
        if (isOpen && !isCloseIconPresent) {
          deleteBlock(uid);
        } else if (!isOpen && isCloseIconPresent) {
          createBlock({ node: { text: "open" }, parentUid });
        }
      });
      sidebarStyleObserver.observe(rightSidebar, { attributes: true });

      if (getTreeByPageName(CONFIG).some((i) => /open/i.test(i.text))) {
        window.roamAlphaAPI.ui.rightSidebar.open();
      }
    }
  });

  createHTMLObserver({
    tag: "DIV",
    className: "rm-sidebar-outline",
    callback: (d: HTMLDivElement) =>
      Array.from(d.getElementsByClassName("rm-title-display")).forEach((h) => {
        const linkIconContainer = document.createElement("span");
        iconRender({
          p: linkIconContainer,
          onClick: () =>
            window.location.assign(
              getRoamUrlByPage(h.firstElementChild.innerHTML)
            ),
          icon: "link",
        });
      }),
  });

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "BUTTON") {
      const button = target as HTMLButtonElement;
      const popover = button.closest(".bp3-popover-enter-done") as HTMLElement;
      if (isPopoverThePageFilter(popover)) {
        const title = getPageTitleByPageUid(getCurrentPageUid());
        const targetTag = button.firstChild.nodeValue;
        const filters = getTreeByPageName(CONFIG).find((f) =>
          /filters/i.test(f.text)
        );
        const filterUid =
          filters?.uid ||
          createBlock({
            node: { text: "filters" },
            parentUid: getPageUidByPageTitle(CONFIG),
          });
        const titleBlock = (filters?.children || []).find(
          (t) => t.text === title
        );

        const includeRemoveContainer = button.closest(".flex-h-box");
        if (includeRemoveContainer) {
          if (includeRemoveContainer.lastElementChild.contains(button)) {
            const removesTagUid = (
              (titleBlock?.children || []).find((t) => /removes/i.test(t.text))
                ?.children || []
            ).find((t) => t.text === targetTag)?.uid;
            deleteBlock(removesTagUid);
          } else if (
            includeRemoveContainer.firstElementChild.contains(button)
          ) {
            const includesTagUid = (
              (titleBlock?.children || []).find((t) => /includes/i.test(t.text))
                ?.children || []
            ).find((t) => t.text === targetTag)?.uid;
            deleteBlock(includesTagUid);
          }
        } else {
          const titleUid =
            titleBlock?.uid ||
            createBlock({ node: { text: title }, parentUid: filterUid });
          if (e.shiftKey) {
            const removeTagBlock = (titleBlock?.children || []).find((t) =>
              /removes/i.test(t.text)
            );
            const removeTagUid =
              removeTagBlock?.uid ||
              createBlock({ node: { text: "removes" }, parentUid: titleUid });
            createBlock({ node: { text: targetTag }, parentUid: removeTagUid });
          } else {
            const includeTagBlock = (titleBlock?.children || []).find((t) =>
              /includes/i.test(t.text)
            );
            const includeTagUid =
              includeTagBlock?.uid ||
              createBlock({ node: { text: "includes" }, parentUid: titleUid });
            createBlock({
              node: { text: targetTag },
              parentUid: includeTagUid,
            });
          }
        }
      }
    }
  });
});
