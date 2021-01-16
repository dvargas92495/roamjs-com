import { Drawer, MenuItem, Position } from "@blueprintjs/core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

const MarkmapPanel: React.FunctionComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const containerRef = useRef(null);
  useEffect(() => {
    if (containerRef.current && isOpen) {
      const overlay = containerRef.current.closest(
        ".bp3-overlay-container"
      ) as HTMLDivElement;
      const content = containerRef.current.closest(
        ".bp3-overlay-content"
      ) as HTMLDivElement;
      if (overlay && content) {
        overlay.style.pointerEvents = "none";
        content.style.pointerEvents = "initial";
      }
    }
  }, [containerRef.current, isOpen]);
  return (
    <>
      <MenuItem text={"Open Markmap"} onClick={open} />
      <Drawer
        onClose={close}
        title="Markmap Panel"
        isOpen={isOpen}
        position={Position.BOTTOM}
        hasBackdrop={false}
        canOutsideClickClose={false}
        canEscapeKeyClose
        enforceFocus={false}
      >
        <div ref={containerRef}>Markmap!</div>
      </Drawer>
    </>
  );
};

export const render = (li: HTMLLIElement): void =>
  ReactDOM.render(<MarkmapPanel />, li);

export default MarkmapPanel;
