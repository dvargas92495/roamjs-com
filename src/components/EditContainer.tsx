import { Button } from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import { openBlock, openBlockElement } from "../entry-helpers";

const EditContainer: React.FunctionComponent<{
  blockId?: string;
  className?: string;
  containerStyleProps?: React.CSSProperties;
  refresh?: () => void;
  Settings?: React.ReactNode;
}> = ({
  blockId,
  className,
  children,
  containerStyleProps = {},
  refresh,
  Settings,
}) => {
  const [showIcons, setShowIcons] = useState(false);
  const appear = useCallback(() => setShowIcons(true), [setShowIcons]);
  const disappear = useCallback(() => setShowIcons(false), [setShowIcons]);

  const [showSettings, setShowSettings] = useState(false);
  const toggleSettings = useCallback(() => setShowSettings(!showSettings), [
    setShowSettings,
    showSettings,
  ]);
  return (
    <div
      className={className}
      onMouseOver={appear}
      onMouseLeave={disappear}
      style={{ position: "relative", ...containerStyleProps }}
    >
      {showIcons && (
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 1000 }}>
          {!!Settings && (
            <Button
              icon={"wrench"}
              onClick={toggleSettings}
              style={{
                backgroundColor: showSettings
                  ? "rgba(115,134,148,0.3)"
                  : "transparent",
              }}
              minimal
            />
          )}
          {refresh && <Button icon={"refresh"} onClick={refresh} minimal />}
          {blockId && (
            <Button icon="edit" minimal onClick={() => openBlock(blockId)} />
          )}
        </div>
      )}
      {showSettings && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: 3,
            padding: 20,
            border: "1px solid #333333",
          }}
        >
          <h4>Settings:</h4>
          {Settings}
        </div>
      )}
      {children}
    </div>
  );
};

export const render = (d: HTMLElement): void => {
  const div = document.createElement("div");
  d.appendChild(div);
  d.style.position = "relative";
  div.style.position = "absolute";
  div.style.top = "0";
  div.style.right = "0";
  div.style.zIndex = "1000";
  ReactDOM.render(
    <Button
      icon="edit"
      minimal
      onClick={() => openBlockElement(d.closest(".roam-block") as HTMLElement)}
    />,
    div
  );
};

export const editContainerRender = (
  Fc: React.FunctionComponent<{ blockId: string }>
) => (b: HTMLButtonElement): void =>
  ReactDOM.render(
    <Fc blockId={b.closest(".roam-block")?.id} />,
    b.parentElement
  );

export default EditContainer;
