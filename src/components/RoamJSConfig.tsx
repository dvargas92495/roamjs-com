import { Button, Card, H4, InputGroup, Label } from "@blueprintjs/core";
import React, { ChangeEvent } from "react";
import ReactDOM from "react-dom";

export type ExtensionConfig = { [key: string]: string };

const RoamJSConfig = ({
  extensionConfig,
}: {
  extensionConfig: ExtensionConfig;
}) => {
  const labels = Object.keys(extensionConfig);
  return (
    <Card>
      <H4>RoamJS Config</H4>
      {labels.map((l) => (
        <Label key={l}>
          <InputGroup
            value={extensionConfig[l]}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              (extensionConfig[l] = e.target.value)
            }
          />
        </Label>
      ))}
      <Button text="SAVE" />
    </Card>
  );
};

export const renderConfig = ({
  extensionConfig,
  parent,
}: {
  extensionConfig: ExtensionConfig;
  parent: HTMLElement;
}) =>
  ReactDOM.render(<RoamJSConfig extensionConfig={extensionConfig} />, parent);

export default RoamJSConfig;
