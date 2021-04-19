import {
  Button,
  Classes,
  Dialog,
  InputGroup,
  Intent,
  Label,
} from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import {
  createBlock,
  getPageUidByPageTitle,
  getTreeByPageName,
} from "roam-client";

const SaveSidebar = (): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const [value, setValue] = useState("");
  return (
    <>
      <Button icon={"saved"} minimal onClick={open} />
      <Dialog
        isOpen={isOpen}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={close}
      >
        <div className={Classes.DIALOG_BODY}>
          <Label>
            Label
            <InputGroup
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </Label>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              text={"Save"}
              disabled={!value}
              onClick={() => {
                const windows = window.roamAlphaAPI.ui.rightSidebar.getWindows();
                const parentUid = getPageUidByPageTitle("roam/js/sidebar");
                const { uid, children } =
                  getTreeByPageName("roam/js/sidebar").find((c) =>
                    /saved/i.test(c.text)
                  ) || {};
                const configToSave = {
                  text: value,
                  children: windows.map((w) => ({
                    text: w.type,
                    children: [{ text: w["block-uid"] }],
                  })),
                };
                createBlock({
                  node: uid
                    ? configToSave
                    : { text: "saved", children: [configToSave] },
                  parentUid: uid || parentUid,
                  order: children.length,
                });
              }}
              intent={Intent.PRIMARY}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};

export const render = (p: HTMLElement): void => ReactDOM.render(<SaveSidebar />, p);

export default SaveSidebar;
