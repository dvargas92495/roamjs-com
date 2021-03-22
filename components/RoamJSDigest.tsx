import { Body, H4 } from "@dvargas92495/ui";
import dynamic from "next/dynamic";
import React from "react";

const ConvertKitComponent = dynamic(() => import("./ConvertKit"), {
  ssr: false,
});

const RoamJSDigest = (): React.ReactElement => {
  return (
    <div style={{ width: "fit-content", display: "inline-block" }}>
      <H4>ROAMJS DIGEST</H4>
      <Body>
        Add your email below to stay up to date on all RoamJS features, fixes,
        and news!
      </Body>
      <ConvertKitComponent />
    </div>
  );
};

export default RoamJSDigest;
