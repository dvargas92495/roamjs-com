import React from "react";
import dynamic from "next/dynamic";

const DynamicYoutube = dynamic(() => import("react-youtube"));

const Youtube: React.FunctionComponent<{ id: string }> = ({ id }) => {
  return (
    <DynamicYoutube
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

export default Youtube;
