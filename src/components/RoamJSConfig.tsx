import { Button, Card, H4, InputGroup } from "@blueprintjs/core";
import React from "react";
import ReactDOM from "react-dom";

const RoamJSConfig = () => {
  return (
    <Card>
      <H4>RoamJS Config</H4>
      <InputGroup placeholder={"Google Calendar"} />
      <Button text="SAVE" />
    </Card>
  );
};

export const renderConfig = (p: HTMLElement) =>
  ReactDOM.render(<RoamJSConfig />, p);

export default RoamJSConfig;
