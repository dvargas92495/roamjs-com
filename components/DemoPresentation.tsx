import React from "react";
import dynamic from "next/dynamic";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";

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
      {
        text: "Second Bullet supporting that point",
        children: [{ text: "With a nested point!", children: [] }],
      },
      { text: "Third bullet sealing the deal", children: [] },
    ],
  },
  { text: "Final Slide", children: [] },
];

const DemoPresentation: React.FunctionComponent = () => {
  const Presentation = dynamic(
    () => {
      const styles = Array.from(document.getElementsByTagName("style"));
      const main = styles.find((s) => s.innerText.includes("reveal.js 4.0.2"));
      if (main) {
        main.className = "roamjs-style-reveal";
        main.id = "roamjs-style-reveal-reveal.css";
      }
      const theme = styles.find((s) => s.innerText.includes("Black theme"));
      if (theme) {
        theme.className = "roamjs-style-reveal";
        theme.id = "roamjs-style-reveal-black.css";
      }
      return import("../src/components/Presentation");
    },
    {
      ssr: false,
    }
  );
  return <Presentation getSlides={getSlides} />;
};

export default DemoPresentation;
