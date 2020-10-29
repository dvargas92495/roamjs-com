import React from "react";

const DemoVideo = ({ src }: {src: string}) => (
  <video
    width="320"
    height="240"
    controls
    src={`/videos/${src}.mp4`}
    style={{ display: "block" }}
  />
);

export default DemoVideo;
