import React from "react";
import dynamic from "next/dynamic";

const getSlides = () => [
  { title: "First Slide", content: [] },
  {
    title: "Second Slide",
    content: ["With a Subtitle on what we're all about"],
  },
  {
    title: "Third Slide",
    content: [
      "First bullet with a point",
      "Second Bullet supporting that point",
      "Third bullet sealing the deal",
    ],
  },
  { title: "# Final Slide", content: [] },
];

const DemoPresentation: React.FunctionComponent = () => {
  const Presentation = dynamic(() => import("../src/components/Presentation"), {
    ssr: false,
  });
  return <Presentation getSlides={getSlides} />;
};

export default DemoPresentation;
