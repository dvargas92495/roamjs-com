import React from "react";
import StandardLayout from "../../components/StandardLayout";
import RoamJSDigest from "../../components/RoamJSDigest";

const SubscribePage = (): React.ReactElement => {
  return (
    <StandardLayout
      title={"Subscribe | RoamJS"}
      description={
        "Subscribe to the RoamJS digest for updates on RoamJS features and news!"
      }
    >
      <div style={{ width: "100%", textAlign: "center" }}>
        <RoamJSDigest />
      </div>
    </StandardLayout>
  );
};

export default SubscribePage;
