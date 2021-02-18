import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { getUids, getTreeByBlockUid } from "roam-client";
import {
  addStyle,
  getPageUidByPageTitle,
  track,
  extractTag,
} from "../entry-helpers";
import { MapContainer, Marker, TileLayer, Popup } from "react-leaflet";
import { LatLngExpression, Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import EditContainer from "./EditContainer";
import axios from "axios";

addStyle(`.leaflet-pane {
  z-index: 10 !important;
}`);

// https://github.com/Leaflet/Leaflet/blob/c0bf09ba32e71fdf29f91808c8b31bbb5946cc74/src/layer/marker/Icon.Default.js
const MarkerIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

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
}): JSX.Element => {
  const id = useMemo(() => `roamjs-maps-container-id-${blockId}`, [blockId]);
  const [href, setHref] = useState("https://roamresearch.com");
  useEffect(() => {
    const windowHref = window.location.href;
    setHref(
      windowHref.includes("/page/")
        ? windowHref.substring(0, windowHref.indexOf("/page/"))
        : windowHref
    );
  }, [setHref]);
  const popupCallback = useCallback(
    (tag: string) => () => {
      const extractedTag = extractTag(tag);
      if (extractedTag !== tag) {
        const pageUid = getPageUidByPageTitle(extractedTag);
        if (pageUid) {
          window.location.assign(`${href}/page/${pageUid}`);
        }
      }
    },
    [href]
  );
  return (
    <EditContainer blockId={blockId}>
      <MapContainer center={center} zoom={zoom} id={id} style={{ height: 400 }}>
        <TileLayer
          attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
          url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}"
          accessToken={process.env.MAPBOX_TOKEN}
          id="mapbox/streets-v11"
        />
        {markers.map((m, i) => (
          <Marker position={[m.x, m.y]} key={i} icon={MarkerIcon} title={m.tag}>
            <Popup onOpen={popupCallback(m.tag)}>{m.tag}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </EditContainer>
  );
};

const getCoords = (tag: string) =>
  axios
    .get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${extractTag(
        tag
      )}.json?access_token=${process.env.MAPBOX_TOKEN}`
    )
    .then((r) =>
      r.data.features?.length
        ? (r.data.features[0].center as number[]).reverse()
        : [NaN, NaN]
    );

export const render = (b: HTMLButtonElement): void => {
  const block = b.closest(".roam-block");
  if (!block) {
    return;
  }
  const blockId = block.id;
  const { blockUid } = getUids(
    document.getElementById(blockId) as HTMLDivElement
  );
  const tree = getTreeByBlockUid(blockUid);
  const markerNode = tree.children.find(
    (c) => c.text.trim().toUpperCase() === "MARKERS"
  );
  const centerNode = tree.children.find(
    (c) => c.text.trim().toUpperCase() === "CENTER"
  );
  const zoomNode = tree.children.find(
    (c) => c.text.trim().toUpperCase() === "ZOOM"
  );
  const zoom =
    zoomNode && zoomNode.children[0] && parseInt(zoomNode.children[0].text);
  const center =
    centerNode &&
    centerNode.children[0] &&
    centerNode.children[0].text.split(",").map((s) => parseFloat(s.trim()));
  const getMarkers = markerNode
    ? Promise.all(
        markerNode.children.map((m) => {
          const tag = m.text.trim();
          const coords = m.children.length
            ? Promise.resolve(
                m.children[0].text.split(",").map((s) => parseFloat(s.trim()))
              )
            : getCoords(tag);
          return coords.then(([x, y]) => ({
            tag,
            x,
            y,
          }));
        })
      ).then((markers) => markers.filter(({ x, y }) => !isNaN(x) && !isNaN(y)))
    : Promise.resolve([]);
  getMarkers.then((markers) => {
    track("Use Extension", {
      extensionId: "maps",
      action: "Render",
    });
    ReactDOM.render(
      <Maps
        blockId={blockId}
        zoom={isNaN(zoom) ? undefined : zoom}
        center={
          !center || center.length !== 2 || center.some((c) => isNaN(c))
            ? undefined
            : (center as LatLngExpression)
        }
        markers={markers}
      />,
      b.parentElement
    );
  });
};

export default Maps;
