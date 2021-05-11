import React from "react";
import ReactYoutube from "react-youtube";

const Youtube: React.FunctionComponent<{ id: string }> = ({ id }) => {
  return (
    <ReactYoutube
      videoId={id}
      id={`roamjs-youtube-${id}`}
      opts={{
        width: "100%",
        playerVars: {
          origin: "https://roamjs.com",
          autoplay: 0 as const,
          rel: 0 as const,
        },
      }}
    />
  );
};

export default Youtube;
