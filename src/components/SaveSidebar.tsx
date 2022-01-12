import {
  Button,
  Checkbox,
  Classes,
  Dialog,
  InputGroup,
  Intent,
  Label,
  Tooltip,
} from "@blueprintjs/core";
import React, { useCallback, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  createBlock,
  getCurrentPageUid,
  getPageUidByPageTitle,
  getTreeByPageName,
  deleteBlock,
} from "roam-client";
import { SidebarWindow } from "roam-client/lib/types";
import { getWindowUid, openBlockElement } from "../entry-helpers";
import { getRenderRoot } from "./hooks";
import MenuItemSelect from "roamjs-components/components/MenuItemSelect";

const SaveSidebar = (): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const [blockUid, setBlockUid] = useState("");
  const open = useCallback(() => {
    setIsOpen(true);
    setBlockUid(window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"] || "");
  }, [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const [value, setValue] = useState("");
  const [savePageState, setSavePageState] = useState(false);
  const savedSidebar = useMemo(
    () =>
      getTreeByPageName("roam/js/sidebar").find((c) => /saved/i.test(c.text))
        ?.children || [],
    [isOpen]
  );
  const labelByUid = useMemo(
    () => Object.fromEntries(savedSidebar.map((s) => [s.uid, s.text])),
    [savedSidebar]
  );
  const [label, setLabel] = useState<string>("NEW");
  return (
    <>
      <Tooltip content={"Save sidebar windows"}>
        <Button icon={"saved"} minimal onClick={open} />
      </Tooltip>
      <Dialog
        isOpen={isOpen}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={close}
        title={"Save Sidebar Content"}
      >
        <div className={Classes.DIALOG_BODY}>
          <h6>Enter the label to save the content of this sidebar under:</h6>
          {label === "NEW" && (
            <Label>
              New Label
              <InputGroup
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </Label>
          )}
          <Label>
            Save As
            <MenuItemSelect
              activeItem={label}
              items={["NEW", ...savedSidebar.map((s) => s.uid)]}
              transformItem={(s) => labelByUid[s] || "NEW"}
              onItemSelect={(s) => setLabel(s)}
            />
          </Label>
          <Checkbox
            checked={savePageState}
            onChange={(e) =>
              setSavePageState((e.target as HTMLInputElement).checked)
            }
            label={"Save Page State?"}
          />
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              text={"Save"}
              disabled={label !== "NEW" && !value}
              onClick={() => {
                const windows =
                  window.roamAlphaAPI.ui.rightSidebar.getWindows();
                const parentUid = getPageUidByPageTitle("roam/js/sidebar");
                const { uid, children } =
                  getTreeByPageName("roam/js/sidebar").find((c) =>
                    /saved/i.test(c.text)
                  ) || {};
                const configToSave = {
                  text: value,
                  children: windows
                    .map((w) => ({
                      text: w.type as string,
                      children: [
                        { text: getWindowUid(w) },
                        ...(w["pinned?"] ? [{ text: "pinned" }] : []),
                      ],
                    }))
                    .concat(
                      ...(savePageState
                        ? [
                            {
                              text: "page",
                              children: [
                                { text: getCurrentPageUid() },
                                {
                                  text: blockUid,
                                },
                              ],
                            },
                          ]
                        : [])
                    ),
                };
                if (label !== 'NEW') {
                  (
                    children.find((c) => c.uid === label)?.children || []
                  ).forEach((c) => deleteBlock(c.uid));
                  configToSave.children.forEach((node, order) =>
                    createBlock({ node, order, parentUid: label })
                  );
                } else {
                  createBlock({
                    node: uid
                      ? configToSave
                      : { text: "saved", children: [configToSave] },
                    parentUid: uid || parentUid,
                    order: children?.length,
                  });
                }
                close();
              }}
              intent={Intent.PRIMARY}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};

const LoadSidebar = ({ onClose }: { onClose: () => void }) => {
  const savedSidebar = useMemo(
    () =>
      getTreeByPageName("roam/js/sidebar").find((c) => /saved/i.test(c.text)),
    []
  );
  const savedSidebarConfigs = useMemo(
    () => savedSidebar.children.map((t) => t.text),
    [savedSidebar]
  );
  const [label, setLabel] = useState(savedSidebarConfigs[0]);
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title={"Load Sidebar Content"}
      canEscapeKeyClose
      canOutsideClickClose
    >
      <div className={Classes.DIALOG_BODY}>
        <h6>Pick which label to load to the sidebar:</h6>
        <Label>
          Label
          <MenuItemSelect
            items={savedSidebarConfigs}
            onItemSelect={(s) => setLabel(s)}
            activeItem={label}
          />
        </Label>
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button
            text={"Load"}
            disabled={!label}
            onClick={() => {
              window.roamAlphaAPI.ui.rightSidebar.open();
              const openUids = Object.fromEntries(
                window.roamAlphaAPI.ui.rightSidebar
                  .getWindows()
                  .map((w) => [getWindowUid(w), w.type])
              );
              const config =
                savedSidebar.children.find((t) => t.text === label)?.children ||
                [];
              config
                .filter((w) => w.text !== "page")
                .map((w, i) => ({
                  type: w.text as SidebarWindow["type"],
                  "block-uid": w.children[0]?.text,
                  order: i,
                  "pinned?": /pinned/i.test(w.children[1]?.text),
                }))
                .filter((w) => openUids[w["block-uid"]] !== w.type)
                .forEach((w) => {
                  window.roamAlphaAPI.ui.rightSidebar.addWindow({ window: w });
                  window.roamAlphaAPI.ui.rightSidebar.setWindowOrder({
                    window: w,
                  });
                  if (w["pinned?"]) {
                    window.roamAlphaAPI.ui.rightSidebar.pinWindow({
                      window: w,
                    });
                  }
                });
              const pageConfig = config.find((t) => t.text === "page");
              if (pageConfig) {
                const [pageUid, blockUid] = pageConfig.children;
                if (pageUid) {
                  setTimeout(() => {
                    window.roamAlphaAPI.ui.mainWindow.openPage({
                      page: { uid: pageUid.text },
                    });
                    if (blockUid) {
                      setTimeout(() => {
                        const div = Array.from(
                          document.querySelectorAll<HTMLDivElement>(
                            ".roam-block"
                          )
                        ).find((d) => d.id.endsWith(blockUid.text));
                        if (div) openBlockElement(div);
                      }, 1000);
                    }
                  }, 1);
                }
              }
              onClose();
            }}
          />
        </div>
      </div>
    </Dialog>
  );
};

export const render = (p: HTMLElement): void =>
  ReactDOM.render(<SaveSidebar />, p);

export const loadRender = (): void => {
  const parent = getRenderRoot("load-sidebar");
  ReactDOM.render(
    <LoadSidebar
      onClose={() => {
        ReactDOM.unmountComponentAtNode(parent);
        parent.remove();
      }}
    />,
    parent
  );
};

export default SaveSidebar;
