import { Button, Card, InputGroup } from "@blueprintjs/core";
import { Config } from "mixpanel-browser";
import React from "react";
import ReactDOM from "react-dom";

const RoamJSConfig = () => {
  return (
    <Card>
      <InputGroup placeholder={"Google Calendar"} />
      <Button text="SAVE" />
    </Card>
  );
};

export const renderConfig = (p: HTMLElement) =>
  ReactDOM.render(<RoamJSConfig />, p);

export default RoamJSConfig;
