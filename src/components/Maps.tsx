import React, { useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import { getUids } from "roam-client";
import { getTextTreeByBlockUid } from "../entry-helpers";

const Maps = ({ blockId }: { blockId: string }) => {
  const id = useMemo(() => `roamjs-maps-container-id-${blockId}`, [blockId]);
  useEffect(() => {
      import('leaflet').then(l => {
          const Leaflet = l.default;
          Leaflet.map(id).setView([51.505, -0.09], 13);
      });
  }, [id]);
  return (
    <div style={{height: 180}} id={id} />
  );
};

export const render = (b: HTMLButtonElement) => {
  const blockId = b.closest(".roam-block").id;
  const { blockUid } = getUids(
    document.getElementById(blockId) as HTMLDivElement
  );
  const tree = getTextTreeByBlockUid(blockUid);
  ReactDOM.render(<Maps blockId={blockId} />, b.parentElement);
};

export default Maps;
