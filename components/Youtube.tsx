import React from "react";
import YouTube from "react-youtube";

const Loom: React.FunctionComponent<{ id: string }> = ({ id }) => {
  return (
    <YouTube
      videoId={id}
      id={`roamjs-youtube-${id}`}
      opts={{
        width: "100%",
        playerVars: {
          origin: window.location.origin,
          autoplay: 0 as const,
          rel: 0 as const,
        },
      }}
    />
  );
};

export default Loom;
