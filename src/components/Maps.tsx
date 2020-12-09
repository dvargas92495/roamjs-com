import React, { useMemo } from "react";
import ReactDOM from "react-dom";
import { getUids } from "roam-client";
import { getTextTreeByBlockUid } from "../entry-helpers";
import { MapContainer, Marker, TileLayer, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

const Maps = ({
  blockId,
  zoom = 13,
  center = [51.505, -0.09],
  markers = [],
}: {
  blockId: string;
  zoom?: number;
  center?: LatLngExpression;
  markers?: { x: number; y: number; tag: string }[];
}) => {
  const id = useMemo(() => `roamjs-maps-container-id-${blockId}`, [blockId]);
  return (
    <MapContainer center={center} zoom={zoom} id={id} style={{ height: 400 }}>
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m, i) => (
        <Marker position={[m.x, m.y]} key={i}>
          <Popup>{m.tag}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export const render = (b: HTMLButtonElement) => {
  const blockId = b.closest(".roam-block").id;
  const { blockUid } = getUids(
    document.getElementById(blockId) as HTMLDivElement
  );
  const tree = getTextTreeByBlockUid(blockUid);
  const markerNode = tree.children.find((c) => c.text.startsWith("Markers"));
  const centerNode = tree.children.find((c) => c.text.startsWith("Center"));
  const zoomNode = tree.children.find((c) => c.text.startsWith("Zoom"));
  const zoom = parseInt(zoomNode?.text);
  const center =
    centerNode && centerNode.text.split(",").map((s) => parseFloat(s));
  const markers = markerNode.children
    .map((m) => m.text.split(","))
    .filter((m) => m.length === 3)
    .map((m) => ({
      tag: m[0],
      x: parseFloat(m[1]),
      y: parseFloat(m[2]),
    }))
    .filter(({ x, y }) => !isNaN(x) && !isNaN(y));
  ReactDOM.render(
    <Maps
      blockId={blockId}
      zoom={isNaN(zoom) ? undefined : zoom}
      center={
        center.length !== 2 || center.some((c) => isNaN(c))
          ? undefined
          : (center as LatLngExpression)
      }
      markers={markers}
    />,
    b.parentElement
  );
};

export default Maps;
