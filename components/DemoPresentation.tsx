import React from "react";
import dynamic from "next/dynamic";

const getSlides = () => [
  { text: "First Slide", children: [] },
  {
    text: "Second Slide",
    children: [
      { text: "With a Subtitle on what we're all about", children: [] },
    ],
  },
  {
    text: "Third Slide",
    children: [
      { text: "First bullet with a point", children: [] },
      { text: "Second Bullet supporting that point", children: [] },
      { text: "Third bullet sealing the deal", children: [] },
    ],
  },
  { text: "# Final Slide", children: [] },
];

const DemoPresentation: React.FunctionComponent = () => {
  const Presentation = dynamic(() => import("../src/components/Presentation"), {
    ssr: false,
  });
  return <Presentation getSlides={getSlides} />;
};

export default DemoPresentation;
