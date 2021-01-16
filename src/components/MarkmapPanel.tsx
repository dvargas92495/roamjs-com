import { Drawer, MenuItem, Position } from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";

const MarkmapPanel: React.FunctionComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  return (
    <>
      <MenuItem text={"Open Markmap"} onClick={open} />
      <Drawer
        icon="info-sign"
        onClose={close}
        title="Markmap Panel"
        isOpen={isOpen}
        position={Position.RIGHT}
        hasBackdrop={false}
        canOutsideClickClose={false}
        canEscapeKeyClose
      >
        Markmap!
      </Drawer>
    </>
  );
};

export const render = (li: HTMLLIElement): void =>
  ReactDOM.render(<MarkmapPanel />, li);

export default MarkmapPanel;
