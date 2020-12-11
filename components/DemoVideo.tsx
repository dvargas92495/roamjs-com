import React from "react";

const DemoVideo = ({ src }: {src: string}) => (
  <video
    width="320"
    height="240"
    controls
    src={`${process.env.APP_BASE_PATH || ''}/videos/${src}.mp4`}
    style={{ display: "block", marginBottom: 16 }}
  />
);

export default DemoVideo;
