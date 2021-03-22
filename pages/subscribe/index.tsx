import React from "react";
import StandardLayout from "../../components/StandardLayout";
import RoamJSDigest from "../../components/RoamJSDigest";

const SubscribePage = (): React.ReactElement => {
  return (
    <StandardLayout>
      <div style={{ width: "100%", textAlign: "center" }}>
        <RoamJSDigest />
      </div>
    </StandardLayout>
  );
};

export default SubscribePage;
