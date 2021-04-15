import { Spinner } from "@blueprintjs/core";
import React, { useEffect, useState } from "react";
import {
  TOKEN_STAGE,
  MainStage,
  ServiceDashboard,
  StageContent,
} from "./ServiceCommonComponents";

const DeveloperContent: StageContent = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (loading) {
      setTimeout(() => setLoading(false), 5000);
    }
  }, [loading, setLoading]);
  return loading ? <Spinner /> : <div>Developer Dashboard coming soon!</div>;
};

const DeveloperDashboard = (): React.ReactElement => (
  <ServiceDashboard
    service={"developer"}
    stages={[TOKEN_STAGE, MainStage(DeveloperContent)]}
  />
);

export default DeveloperDashboard;
