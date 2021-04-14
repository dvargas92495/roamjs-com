import axios from "axios";
import React, { useEffect, useRef } from "react";
import { getTextByBlockUid, getUidsFromId } from "roam-client";
import EditContainer, { editContainerRender } from "./EditContainer";

const REGEX = /^https?:\/\//i;

const IframelyEmbed = ({
  blockId,
}: {
  blockId: string;
}): React.ReactElement => {
  const containerRef = useRef(null);
  useEffect(() => {
    const { blockUid } = getUidsFromId(blockId);
    const text = getTextByBlockUid(blockUid);
    const inputUrl = /{{(?:\[\[)?iframely(?:\]\])?:(.*?)}}/.exec(text)?.[1];
    if (inputUrl) {
      const url = REGEX.test(inputUrl) ? inputUrl : `https://${inputUrl}`;
      axios.post(`${process.env.REST_API_URL}/iframely`, { url }).then((r) => {
        const { html } = r.data;
        const children = new DOMParser().parseFromString(html, "text/html").body
          .children;
        Array.from(children).forEach((c) => {
          if (c.tagName === "SCRIPT") {
            const oldScript = c as HTMLScriptElement;
            const script = document.createElement("script");
            script.src = oldScript.src;
            script.async = oldScript.async;
            script.type = "text/javascript";
            containerRef.current.appendChild(script);
          } else {
            containerRef.current.appendChild(c);
          }
        });
      });
    }
  }, [containerRef, blockId]);
  return (
    <EditContainer blockId={blockId}>
      <div ref={containerRef} />
    </EditContainer>
  );
};

export const render = editContainerRender(IframelyEmbed);

export default IframelyEmbed;
