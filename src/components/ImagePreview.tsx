import { Dialog } from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";

const ImagePreview = ({ src }: { src: string }): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const onClose = useCallback(() => setIsOpen(false), [setIsOpen]);
  const onClick = useCallback(() => setIsOpen(true), [setIsOpen]);
  return (
    <>
      <style>
        {`.roamjs-img-dialog {
  z-index: 2100;
}
.roamjs-img-dialog .bp3-dialog {
  position: absolute;
  top: 32px;
  bottom: 32px;
  left: 32px;
  right: 32px;
  width: unset;
  background-color: transparent;
}`}
      </style>
      <img src={src} onClick={onClick} data-roamjs-image-preview />
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        portalClassName={"roamjs-img-dialog"}
        style={{ paddingBottom: 0 }}
        canEscapeKeyClose
        canOutsideClickClose
      >
        <img src={src} onClick={onClose} />
      </Dialog>
    </>
  );
};

export const render = ({ p, src }: { p: HTMLElement; src: string }): void =>
  ReactDOM.render(<ImagePreview src={src} />, p);

export default ImagePreview;
