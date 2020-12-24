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
      { text: "![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdvargas92495%2FGaXXizN9Qj.png?alt=media&token=3f92cb56-bcbd-4f47-8bfe-a9b774a3608f)", children: [] },
      { text: "overflowing bullet1", children: [] },
      { text: "overflowing bullet2", children: [] },
      { text: "overflowing bullet3", children: [] },
      { text: "overflowing bullet4", children: [] },
      { text: "overflowing bullet5", children: [] },
      { text: "overflowing bullet6", children: [] },
      { text: "overflowing bullet7", children: [] },
      { text: "overflowing bullet8", children: [] },
      { text: "overflowing bullet9", children: [] },
      { text: "overflowing bullet10", children: [] },
      { text: "overflowing bullet11", children: [] },
      { text: "overflowing bullet12", children: [] },
    ],
  },
  {
    text: "Third Slide",
    children: [
      { text: "First bullet with a point", children: [] },
      { text: "Second Bullet supporting that point", children: [{text: 'With a nested point!', children:[]}] },
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
