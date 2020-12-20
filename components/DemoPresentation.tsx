import React from "react";
import dynamic from "next/dynamic";

const getDemoMd = () => [
  "# First Slide",
  "# Second Slide\n\n### With a Subtitle on what we're all about.",
  "# Third Slide\n\nFirst bullet with a point\n\nSecond Bullet supporting that point\n\nThird bullet sealing the deal.",
  '# Final Slide'
]

const DemoPresentation: React.FunctionComponent = () => {
  const Presentation = dynamic(() => import("../src/components/Presentation"), {
    ssr: false,
  });
  return <Presentation getMarkdown={getDemoMd}/>;
};

export default DemoPresentation;
