import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { getUids } from "roam-client";
import { getTextTreeByBlockUid } from "../entry-helpers";
import { MapContainer, TileLayer } from "react-leaflet";

const Maps = ({ blockId }: { blockId: string }) => {
  const id = useMemo(() => `roamjs-maps-container-id-${blockId}`, [blockId]);
  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} id={id}>
      <TileLayer
        attribution='Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
        url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.MAPBOX_TOKEN}`}
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
