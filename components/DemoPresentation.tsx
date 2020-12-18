import React from "react";
import dynamic from "next/dynamic";

const DemoPresentation: React.FunctionComponent = () => {
  const Presentation = dynamic(() => import("../src/components/Presentation"), {
    ssr: false,
  });
  return <Presentation />;
};

export default DemoPresentation;
