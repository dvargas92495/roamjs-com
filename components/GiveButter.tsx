import React from "react";
import IframeResizer from "iframe-resizer-react";

const GiveButter: React.FunctionComponent = () => (
  <>
    <IframeResizer
      src="https://givebutter.com/embed/c/roamjs"
      width="100%"
      height="775px"
      name="givebutter"
      frameBorder="0"
      scrolling={false}
      seamless
      allow="payment"
    />
    <script src="https://givebutter.com/js/widget.js"></script>
  </>
);

export default GiveButter;
