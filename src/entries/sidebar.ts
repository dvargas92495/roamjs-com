import {
  getWindowUid,
  isPopoverThePageFilter,
  openBlockElement,
} from "../entry-helpers";
import { render as iconRender } from "../components/MinimalIcon";
import { loadRender, render as saveRender } from "../components/SaveSidebar";
import SavedSidebarConfig from "../components/SavedSidebarConfig";
import { createConfigObserver } from "roamjs-components/components/ConfigPage";
import toFlexRegex from "roamjs-components/util/toFlexRegex";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import createObserver from "roamjs-components/dom/createObserver";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import runExtension from "roamjs-components/util/runExtension";
import createBlock from "roamjs-components/writes/createBlock";
import deleteBlock from "roamjs-components/writes/deleteBlock";
import FlagPanel from "roamjs-components/components/ConfigPanels/FlagPanel";
import CustomPanel from "roamjs-components/components/ConfigPanels/CustomPanel";
import {
  CustomField,
  Field,
} from "roamjs-components/components/ConfigPanels/types";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";

const ID = "sidebar";
const CONFIG = `roam/js/${ID}`;

const htmlToTitle = (s: HTMLElement): string =>
  Array.from(s.childNodes)
    .map((c) =>
      c.nodeName === "SPAN" ? htmlToTitle(c as HTMLSpanElement) : c.nodeValue
    )
    .join("");

const clickButton = (text: string, shiftKey: boolean) =>
  new Promise<void>((resolve) =>
    setTimeout(() => {
      const button = Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          ".bp3-popover-content .bp3-button"
        )
      ).find((b) => b.firstChild.nodeValue === text);
      if (button) {
        button.dispatchEvent(
          new MouseEvent("click", { bubbles: true, shiftKey })
        );
      }
      resolve();
    }, 1)
  );

runExtension(ID, () => {
  createConfigObserver({
    title: CONFIG,
    config: {
      tabs: [
        {
          id: "home",
          fields: [
            {
              title: "auto focus",
              Panel: FlagPanel,
              description:
                "Whether or not the sidebar should be automatically focused upon opening.",
              defaultValue: true,
            },
            {
              title: "saved",
              Panel: CustomPanel,
              description: "The list of saved sidebar states",
              options: {
                component: SavedSidebarConfig,
              },
            } as Field<CustomField>,
          ],
        },
      ],
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
          tooltipContent: "Expand/Collapse all windows in sidebar",
          toggleIcon: "expand-all",
          onClick: () => {
            rightSidebar
              .querySelectorAll<HTMLSpanElement>(
                ".rm-sidebar-window .window-headers .rm-caret-open"
              )
              .forEach((e) => e.click());
            /* Roam has a bug for non block windows
            window.roamAlphaAPI.ui.rightSidebar.getWindows().forEach((w) => {
              window.roamAlphaAPI.ui.rightSidebar.collapseWindow({
                window: {
                  type: w.type,
                  "block-uid": getWindowUid(w),
                },
              });
            });
            */
          },
          onToggleClick: () => {
            rightSidebar
              .querySelectorAll<HTMLSpanElement>(
                ".rm-sidebar-window .window-headers .rm-caret-closed"
              )
              .forEach((e) => e.click());
            /* Roam has a bug for non block windows
            window.roamAlphaAPI.ui.rightSidebar.getWindows().forEach((w) => {
              window.roamAlphaAPI.ui.rightSidebar.expandWindow({
                window: {
                  type: w.type,
                  "block-uid": getWindowUid(w),
                },
              });
            });
            */
          },
        });
        rightSidebarTopbar.appendChild(expandCollapseContainer);

        const saveSidebarContainer = document.createElement("span");
        saveRender(saveSidebarContainer);
        rightSidebarTopbar.appendChild(saveSidebarContainer);
        window.roamAlphaAPI.ui.commandPalette.addCommand({
          label: "Load Saved Sidebar",
          callback: loadRender,
        });
      }
      observer.disconnect();

      const sidebarStyleObserver = new MutationObserver(() => {
        setTimeout(() => {
          const parentUid = getPageUidByPageTitle(CONFIG);
          const tree = getFullTreeByParentUid(parentUid).children;
          const uid = tree.find((i) => /open/i.test(i.text))?.uid;
          const isOpen = !!uid;
          const isCloseIconPresent = !!document.querySelector(
            ".rm-topbar .bp3-icon-menu-closed"
          );
          if (isOpen && isCloseIconPresent) {
            deleteBlock(uid);
          } else if (!isOpen && !isCloseIconPresent) {
            createBlock({ node: { text: "open" }, parentUid });
            if (tree.some((t) => toFlexRegex("auto focus").test(t.text))) {
              const firstBlock = rightSidebar.getElementsByClassName(
                "roam-block"
              )[0] as HTMLElement;
              if (firstBlock) {
                openBlockElement(firstBlock);
              }
            }
          }
        }, 50);
      });
      sidebarStyleObserver.observe(rightSidebar, { attributes: true });

      if (
        getFullTreeByParentUid(getPageUidByPageTitle(CONFIG)).children.some(
          (i) => /open/i.test(i.text)
        )
      ) {
        window.roamAlphaAPI.ui.rightSidebar.open();
      }
    }
  });

  createHTMLObserver({
    tag: "DIV",
    className: "rm-sidebar-outline",
    callback: (d: HTMLDivElement) =>
      Array.from(d.getElementsByClassName("rm-title-display")).forEach(
        (h: HTMLHeadingElement) => {
          const pageUid = getPageUidByPageTitle(
            htmlToTitle(h.firstElementChild as HTMLSpanElement)
          );
          if (pageUid) {
            const linkIconContainer = document.createElement("span");
            h.addEventListener("mousedown", (e) => {
              if (linkIconContainer.contains(e.target as HTMLElement)) {
                e.stopPropagation();
              }
            });
            iconRender({
              p: linkIconContainer,
              tooltipContent: "Go to page",
              onClick: () =>
                window.roamAlphaAPI.ui.mainWindow.openPage({
                  page: { uid: pageUid },
                }),
              icon: "link",
            });
            h.appendChild(linkIconContainer);
          }
        }
      ),
  });

  createHTMLObserver({
    tag: "DIV",
    className: "rm-sidebar-window",
    callback: (d: HTMLDivElement) => {
      if (
        /^Outline of:/.test((d.firstElementChild as HTMLDivElement).innerText)
      ) {
        const filters =
          getFullTreeByParentUid(getPageUidByPageTitle(CONFIG)).children.find(
            (t) => /filters/i.test(t.text)
          )?.children || [];
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
                  .map((fc) => [fc.text, fc.children.map((fcc) => fcc.text)])
              ),
            ])
          );
          const order = Array.from(
            d.parentElement.parentElement.children
          ).findIndex((c) => c === d.parentElement);
          const filterKey = getPageTitleByPageUid(
            getWindowUid(
              window.roamAlphaAPI.ui.rightSidebar
                .getWindows()
                .find((w) => w.order === order)
            )
          );
          if (parsedFilters[filterKey]) {
            const filterIcon = d.lastElementChild.getElementsByClassName(
              "bp3-icon-filter"
            )[0] as HTMLSpanElement;
            if (filterIcon) {
              filterIcon.click();
              const removePromise = (
                parsedFilters[filterKey]["removes"] || []
              ).reduce(
                (prev, cur) => prev.then(() => clickButton(cur, true)),
                Promise.resolve()
              );
              const includePromise = (
                parsedFilters[filterKey]["includes"] || []
              ).reduce(
                (prev, cur) => prev.then(() => clickButton(cur, false)),
                removePromise
              );
              includePromise.then(() =>
                setTimeout(() => {
                  (
                    d.getElementsByClassName(
                      "bp3-icon-filter"
                    )[0] as HTMLSpanElement
                  )?.click?.();
                }, 1)
              );
            }
          }
        }
      }
    },
  });

  document.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "BUTTON") {
      const button = target as HTMLButtonElement;
      const popover = button.closest(".bp3-popover-enter-done") as HTMLElement;
      if (isPopoverThePageFilter(popover)) {
        const title = getPageTitleByPageUid(
          await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid()
        );
        const targetTag = button.firstChild.nodeValue;
        const filters = getFullTreeByParentUid(
          getPageUidByPageTitle(CONFIG)
        ).children.find((f) => /filters/i.test(f.text));
        const filterUid =
          filters?.uid ||
          (await createBlock({
            node: { text: "filters" },
            parentUid: getPageUidByPageTitle(CONFIG),
          }));
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
            (await createBlock({
              node: { text: title },
              parentUid: filterUid,
            }));
          if (e.shiftKey) {
            const removeTagBlock = (titleBlock?.children || []).find((t) =>
              /removes/i.test(t.text)
            );
            const removeTagUid =
              removeTagBlock?.uid ||
              (await createBlock({
                node: { text: "removes" },
                parentUid: titleUid,
              }));
            createBlock({ node: { text: targetTag }, parentUid: removeTagUid });
          } else {
            const includeTagBlock = (titleBlock?.children || []).find((t) =>
              /includes/i.test(t.text)
            );
            const includeTagUid =
              includeTagBlock?.uid ||
              (await createBlock({
                node: { text: "includes" },
                parentUid: titleUid,
              }));
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
