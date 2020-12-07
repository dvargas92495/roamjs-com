import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { getUids } from "roam-client";
import { getTextTreeByBlockUid } from "../entry-helpers";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const Maps = ({ blockId }: { blockId: string }) => {
  const id = useMemo(() => `roamjs-maps-container-id-${blockId}`, [blockId]);
  return (
    <MapContainer
      center={[51.505, -0.09]}
      zoom={13}
      id={id}
      style={{ height: 400 }}
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
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
