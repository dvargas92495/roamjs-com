import { H4, Body } from "@dvargas92495/ui";
import dynamic from "next/dynamic";
import React from "react";
import StandardLayout from "../../components/StandardLayout";

const ConvertKitComponent = dynamic(
  () => import("../../components/ConvertKit"),
  {
    ssr: false,
  }
);

const SubscribePage = (): React.ReactElement => {
  return (
    <StandardLayout>
      <div style={{ width: "fit-content", display: "inline-block" }}>
        <H4>ROAMJS DIGEST</H4>
        <Body>
          Add your email below to stay up to date on all RoamJS features, fixes,
          and news!
        </Body>
        <ConvertKitComponent />
      </div>
    </StandardLayout>
  );
};

export default SubscribePage;
