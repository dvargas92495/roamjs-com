import { TextArea } from "@blueprintjs/core";
import React, { useEffect } from "react";

export const DemoPopoverWrapper = ({
  WrappedComponent,
  placeholder,
}: {
  WrappedComponent: React.FunctionComponent<{
    blockId: string;
    defaultIsOpen: boolean;
  }>;
  placeholder: string;
}): JSX.Element => {
  useEffect(() => {
    // hack - page is auto scrolling to the top when the button is clicked?!
    const overlayButton = document.getElementsByClassName(
      "bp3-button"
    )[0] as HTMLButtonElement;
    let scrollTop = 0;
    document.addEventListener("mousedown", (e) => {
      if (
        e.target === overlayButton ||
        overlayButton.contains(e.target as Node)
      ) {
        scrollTop = window.scrollY;
      }
    });
    document.addEventListener("click", (e) => {
      if (
        e.target === overlayButton ||
        overlayButton.contains(e.target as Node)
      ) {
        window.scrollTo({ top: scrollTop });
      }
    });
  }, []);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-evenly",
        alignItems: "center",
      }}
    >
      <WrappedComponent blockId={"blockId"} defaultIsOpen={false} />
      <TextArea
        growVertically={true}
        id={"blockId"}
        style={{ width: 400, marginLeft: 16, resize: "none" }}
        placeholder={placeholder}
      />
    </div>
  );
};

export default DemoPopoverWrapper;
