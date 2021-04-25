import { Tooltip } from "@blueprintjs/core";
import React, { useMemo } from "react";
import ReactDOM from "react-dom";
import { getPageTitleByPageUid, getTextByBlockUid } from "roam-client";
import { parseRoamMarked } from "../entry-helpers";

const AliasPreview: React.FunctionComponent<{ blockUid: string }> = ({
  blockUid,
  children,
}) => {
  const html = useMemo(() => {
      const title = getPageTitleByPageUid(blockUid);
      if (title) {
          return `<span data-link-title="${title}" data-link-uid="${blockUid}">
  <span class="rm-page-ref__brackets">[[</span>
  <span tabindex="-1" class="rm-page-ref rm-page-ref--link">${title}</span>
  <span class="rm-page-ref__brackets">]]</span>
</span>`;
      }
      return parseRoamMarked(getTextByBlockUid(blockUid));
  }, [blockUid]);
  return (
    <Tooltip
      content={
        <div dangerouslySetInnerHTML={{ __html: html }} />
      }
    >
      {children}
    </Tooltip>
  );
};

export const render = ({
  p,
  blockUid,
  children,
}: {
  p: HTMLElement;
  blockUid: string;
  children: React.ReactNode;
}): void =>
  ReactDOM.render(
    <AliasPreview blockUid={blockUid}>{children}</AliasPreview>,
    p
  );

export default AliasPreview;
