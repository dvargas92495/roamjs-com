import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { getTextByBlockUid } from "roam-client";
import { resolveRefs } from "../entry-helpers";
import EditContainer, { editContainerRender } from "./EditContainer";

const REGEX = /^https?:\/\//i;

const IframelyEmbed = ({
  blockUid,
}: {
  blockUid: string;
}): React.ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [blockId, setBlockId] = useState("");
  useEffect(() => {
    const possibleBlockId = containerRef.current.closest(".roam-block")?.id;
    if (possibleBlockId.endsWith(blockUid)) {
      setBlockId(possibleBlockId);
    }
    const text = getTextByBlockUid(blockUid);
    const inputUrl = resolveRefs(
      /{{(?:\[\[)?iframely(?:\]\])?:(.*?)}}/.exec(text)?.[1]?.trim?.() || ""
    );
    if (inputUrl) {
      const url = REGEX.test(inputUrl) ? inputUrl : `https://${inputUrl}`;
      axios
        .post(`${process.env.REST_API_URL}/iframely`, { url })
        .then((r) => {
          const { html } = r.data;
          const children = new DOMParser().parseFromString(html, "text/html")
            .body.children;
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
        })
        .catch((e) => {
          containerRef.current.style.color = "darkred";
          if (e.response?.data?.status === 422) {
            containerRef.current.innerText =
              "Iframely failed to handle the input URL";
          } else if (e.response?.data?.status === 404) {
            containerRef.current.innerText =
              "Iframely could not find content at the input URL";
          } else {
            console.error(e);
            containerRef.current.innerText =
              "An unknown error occurred. Please reach out to support@roamjs.com for help!";
          }
        });
    }
  }, [containerRef, blockUid, setBlockId]);
  return (
    <EditContainer blockId={blockId} containerStyleProps={{ minWidth: 300 }}>
      <div ref={containerRef} />
    </EditContainer>
  );
};

export const render = editContainerRender(IframelyEmbed);

export default IframelyEmbed;
