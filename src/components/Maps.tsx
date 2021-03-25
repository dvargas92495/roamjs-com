import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import { getUidsFromId, getPageUidByPageTitle, TreeNode } from "roam-client";
import {
  addStyle,
  extractTag,
  setInputSetting,
  isTagOnPage,
} from "../entry-helpers";
import { MapContainer, Marker, TileLayer, Popup } from "react-leaflet";
import { LatLngExpression, Icon, Map } from "leaflet";
import "leaflet/dist/leaflet.css";
import EditContainer from "./EditContainer";
import axios from "axios";
import { Label } from "@blueprintjs/core";
import PageInput from "./PageInput";
import { getTreeByHtmlId, useTreeByHtmlId } from "./hooks";

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

const DEFAULT_ZOOM = 13;
const DEFAULT_CENTER = [51.505, -0.09] as LatLngExpression;

const getZoom = ({ children }: { children: TreeNode[] }) => {
  const zoomNode = children.find((c) => c.text.trim().toUpperCase() === "ZOOM");
  const newZoom =
    zoomNode && zoomNode.children[0] && parseInt(zoomNode.children[0].text);
  return isNaN(newZoom) ? DEFAULT_ZOOM : newZoom;
};

const getCenter = ({ children }: { children: TreeNode[] }) => {
  const centerNode = children.find(
    (c) => c.text.trim().toUpperCase() === "CENTER"
  );
  const newCenter =
    centerNode &&
    centerNode.children[0] &&
    centerNode.children[0].text.split(",").map((s) => parseFloat(s.trim()));
  return !newCenter || newCenter.length !== 2 || newCenter.some((c) => isNaN(c))
    ? DEFAULT_CENTER
    : (newCenter as LatLngExpression);
};

const getFilter = ({ children }: { children: TreeNode[] }) => {
  return children.find((c) => /filter/i.test(c.text))?.children?.[0]?.text;
};

type RoamMarker = { x: number; y: number; tag: string };

const getMarkers = ({ children }: { children: TreeNode[] }) => {
  const markerNode = children.find(
    (c) => c.text.trim().toUpperCase() === "MARKERS"
  );
  return markerNode
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
    : Promise.resolve([] as RoamMarker[]);
};

const Maps = ({ blockId }: { blockId: string }): JSX.Element => {
  const id = useMemo(() => `roamjs-maps-container-id-${blockId}`, [blockId]);
  const mapInstance = useRef<Map>(null);
  const initialTree = useTreeByHtmlId(blockId);
  const initialZoom = useMemo(() => getZoom(initialTree), [initialTree]);
  const initialCenter = useMemo(() => getCenter(initialTree), [initialTree]);
  const [markers, setMarkers] = useState<RoamMarker[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState(getFilter(initialTree));
  const load = useCallback(() => setLoaded(true), [setLoaded]);
  const refresh = useCallback(() => {
    const tree = getTreeByHtmlId(blockId);
    mapInstance.current.setZoom(getZoom(tree));
    mapInstance.current.panTo(getCenter(tree));
    setFilter(getFilter(tree));
    getMarkers(tree).then((newMarkers) => {
      setMarkers(newMarkers);
    });
  }, [mapInstance, setMarkers, blockId]);

  const [href, setHref] = useState("https://roamresearch.com");
  useEffect(() => {
    const windowHref = window.location.href;
    setHref(
      windowHref.includes("/page/")
        ? windowHref.substring(0, windowHref.indexOf("/page/"))
        : windowHref
    );
  }, [setHref]);
  useEffect(() => {
    if (!loaded) {
      load();
      getMarkers(initialTree).then((newMarkers) => {
        setMarkers(newMarkers);
      });
    }
  }, [load, loaded, initialTree, setMarkers]);
  const popupCallback = useCallback(
    (tag: string) => () => {
      const extractedTag = extractTag(tag);
      const pageUid = getPageUidByPageTitle(extractedTag);
      if (pageUid) {
        window.location.assign(`${href}/page/${pageUid}`);
      }
    },
    [href]
  );
  const filterOnBlur = useCallback(
    (value: string) => {
      setInputSetting({
        blockUid: getUidsFromId(blockId).blockUid,
        value,
        key: "filter",
      });
      setFilter(value);
    },
    [blockId]
  );
  const filteredMarkers = useMemo(
    () =>
      filter
        ? markers.filter((m) =>
            isTagOnPage({ tag: filter, title: extractTag(m.tag) })
          )
        : markers,
    [markers, filter]
  );
  const whenCreated = useCallback((m) => (mapInstance.current = m), [
    mapInstance,
  ]);
  return (
    <EditContainer
      blockId={blockId}
      refresh={refresh}
      Settings={
        <>
          <Label>
            Filter
            <PageInput
              value={filter}
              setValue={setFilter}
              onBlur={filterOnBlur}
            />
          </Label>
        </>
      }
    >
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        id={id}
        style={{ height: 400 }}
        whenCreated={whenCreated}
      >
        <TileLayer
          attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
          url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}"
          accessToken={process.env.MAPBOX_TOKEN}
          id="mapbox/streets-v11"
        />
        {filteredMarkers.map((m, i) => (
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
  b.parentElement.onmousedown = (e: MouseEvent) => e.stopPropagation();
  ReactDOM.render(<Maps blockId={block.id} />, b.parentElement);
};

export default Maps;
