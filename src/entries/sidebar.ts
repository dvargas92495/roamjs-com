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
  getWindowUid,
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
                  "block-uid": getWindowUid(w),
                },
              });
            });
          },
          onToggleClick: () => {
            window.roamAlphaAPI.ui.rightSidebar.getWindows().forEach((w) => {
              window.roamAlphaAPI.ui.rightSidebar.expandWindow({
                window: {
                  type: w.type,
                  "block-uid": getWindowUid(w),
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
        setTimeout(() => {
          const parentUid = getPageUidByPageTitle(CONFIG);
          const tree = getTreeByPageName(CONFIG);
          const uid = tree.find((i) => /open/i.test(i.text))?.uid;
          const isOpen = !!uid;
          const isCloseIconPresent = !!document.getElementsByClassName(
            "bp3-icon-menu-closed"
          ).length;
          if (isOpen && isCloseIconPresent) {
            deleteBlock(uid);
          } else if (!isOpen && !isCloseIconPresent) {
            createBlock({ node: { text: "open" }, parentUid });
            const firstBlock = rightSidebar.getElementsByClassName(
              "roam-block"
            )[0];
            if (firstBlock) {
              const firstBlockId = firstBlock.id;
              firstBlock.dispatchEvent(
                new MouseEvent("mousedown", { bubbles: true })
              );
              setTimeout(() => {
                const textArea = document.getElementById(
                  firstBlockId
                ) as HTMLTextAreaElement;
                textArea.dispatchEvent(
                  new MouseEvent("mouseup", { bubbles: true })
                );
                textArea.setSelectionRange(
                  textArea.value.length,
                  textArea.value.length
                );
              }, 1);
            }
            const filters =
              tree.find((t) => /filters/i.test(t.text))?.children || [];
            if (filters.length) {
              const parsedFilters = Object.fromEntries(
                filters.map((f) => [
                  f.text,
                  Object.fromEntries(
                    f.children
                      .filter(
                        (fc) =>
                          /includes/i.test(fc.text) || /removes/i.test(fc.text)
                      )
                      .map((fc) => [
                        fc.text,
                        fc.children.map((fcc) => fcc.text),
                      ])
                  ),
                ])
              );
              Array.from(
                rightSidebar.getElementsByClassName("rm-sidebar-window")
              )
                .filter((d) =>
                  /^Outline of:/.test(
                    (d.firstElementChild as HTMLDivElement).innerText
                  )
                )
                .map((d) => d.lastElementChild as HTMLDivElement)
                .map((d) => ({
                  filter:
                    parsedFilters[
                      d.getElementsByClassName("rm-title-display")[0]
                        ?.firstElementChild.innerHTML
                    ],
                  d,
                }))
                .filter(({ filter }) => !!filter)
                .map(({ d, filter }) => {
                  const filterIcon = d.getElementsByClassName(
                    "bp3-icon-filter"
                  )[0] as HTMLSpanElement;
                  if (filterIcon) {
                    filterIcon.click();
                    setTimeout(() => {
                      const buttons = Object.fromEntries(
                        Array.from(
                          document.querySelectorAll(
                            ".bp3-popover-content .bp3-button"
                          )
                        ).map((b) => [b.innerHTML, b as HTMLButtonElement])
                      );
                      (filter["removes"] || []).forEach((b) => {
                        if (buttons[b]) {
                          buttons[b].dispatchEvent(
                            new MouseEvent("click", {
                              shiftKey: true,
                              bubbles: true,
                            })
                          );
                        }
                      });
                      (filter["includes"] || []).forEach((b) => {
                        if (buttons[b]) {
                          buttons[b].dispatchEvent(
                            new MouseEvent("click", { bubbles: true })
                          );
                        }
                      });
                      (d.getElementsByClassName(
                        "bp3-icon-filter"
                      )[0] as HTMLSpanElement)?.click?.();
                    }, 1);
                  }
                });
            }
          }
        }, 50);
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
      Array.from(d.getElementsByClassName("rm-title-display")).forEach((h: HTMLHeadingElement) => {
        const linkIconContainer = document.createElement("span");
        h.addEventListener('mousedown', (e) => {
          if (linkIconContainer.contains(e.target as HTMLElement)) {
            e.stopPropagation();
          }
        })
        iconRender({
          p: linkIconContainer,
          onClick: () =>
            window.location.assign(
              getRoamUrlByPage(h.firstElementChild.innerHTML)
            ),
          icon: "link",
        });
        h.appendChild(linkIconContainer);
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
            if (removesTagUid) {
              deleteBlock(removesTagUid);
            }
          } else if (
            includeRemoveContainer.firstElementChild.contains(button)
          ) {
            const includesTagUid = (
              (titleBlock?.children || []).find((t) => /includes/i.test(t.text))
                ?.children || []
            ).find((t) => t.text === targetTag)?.uid;
            if (includesTagUid) {
              deleteBlock(includesTagUid);
            }
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
