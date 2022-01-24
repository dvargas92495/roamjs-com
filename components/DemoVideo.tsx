import React from "react";

const DemoVideo: React.FunctionComponent<{ src: string }> = ({ src }) => (
  <video
    width="320"
    height="240"
    controls
    src={
      src.startsWith("https")
        ? src
        : `${process.env.APP_BASE_PATH || ""}/videos/${src}.mp4`
    }
    style={{ display: "block", marginBottom: 16 }}
  />
);

export default DemoVideo;
