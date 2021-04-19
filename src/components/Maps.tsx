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
  openBlockInSidebar,
} from "../entry-helpers";
import {
  MapContainer,
  Marker,
  TileLayer,
  Popup,
  LayersControl,
  useMap,
} from "react-leaflet";
import { LatLngExpression, Icon, Map, Marker as LMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet/dist/images/layers.png";
import EditContainer from "./EditContainer";
import axios from "axios";
import { Label } from "@blueprintjs/core";
import PageInput from "./PageInput";
import { getTreeByHtmlId, useTreeByHtmlId } from "./hooks";
import { parseInline } from "roam-marked";

addStyle(`.leaflet-pane {
  z-index: 10 !important;
}

.leaflet-retina a.leaflet-control-layers-toggle {
  background-image: url(https://unpkg.com/leaflet@1.7.1/dist/images/layers.png)
}

a.leaflet-popup-close-button {
  display:none;
}
`);

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

const COORDS_REGEX = /((?:-?)(?:0|(?:[1-9][0-9]*))(?:\.[0-9]+)?),(?:\s)?((?:-?)(?:0|(?:[1-9][0-9]*))(?:\.[0-9]+)?)/;
const getMarkers = ({ children }: { children: TreeNode[] }) => {
  const markerNode = children.find(
    (c) => c.text.trim().toUpperCase() === "MARKERS"
  );
  return markerNode
    ? Promise.all(
        markerNode.children.map((m) => {
          const tag = m.text.trim();
          const coords = COORDS_REGEX.test(m.children?.[0]?.text)
            ? Promise.resolve(
                COORDS_REGEX.exec(m.children[0].text)
                  .slice(1, 3)
                  .map((s) => parseFloat(s.trim()))
              )
            : getCoords(m.children?.[0]?.text || tag);
          return coords.then(([x, y]) => ({
            tag,
            x,
            y,
          }));
        })
      ).then((markers) => markers.filter(({ x, y }) => !isNaN(x) && !isNaN(y)))
    : Promise.resolve([] as RoamMarker[]);
};

const Markers = ({
  href,
  markers,
}: {
  href: string;
  markers: RoamMarker[];
}) => {
  const map = useMap();
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore until there's a better way to grab markers
    const leafletMarkers = map._layers as { [key: string]: LMarker };
    Object.keys(leafletMarkers).forEach((k) => {
      const m = leafletMarkers[k];
      m.on({
        mouseover: () => m.openPopup(),
        mouseout: () => m.closePopup(),
        click: (e) => {
          const extractedTag = extractTag(m.options.title);
          const pageUid = getPageUidByPageTitle(extractedTag);
          if (pageUid) {
            if (e.originalEvent.shiftKey) {
              openBlockInSidebar(pageUid);
            } else {
              window.location.assign(`${href}/page/${pageUid}`);
            }
          }
        },
      });
    });
  });
  return (
    <>
      {markers.map((m, i) => (
        <Marker
          position={[m.x, m.y]}
          icon={MarkerIcon}
          key={i}
          title={m.tag}
          riseOnHover
        >
          <Popup>
            <div
              style={{ display: "flex" }}
              dangerouslySetInnerHTML={{ __html: parseInline(m.tag) }}
            />
          </Popup>
        </Marker>
      ))}
    </>
  );
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
  const isShift = useRef(false);
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
  const shiftKeyCallback = useCallback(
    (e: KeyboardEvent) => (isShift.current = e.shiftKey),
    [isShift]
  );
  useEffect(() => {
    if (!loaded) {
      load();
      getMarkers(initialTree).then((newMarkers) => {
        setMarkers(newMarkers);
      });
      document.addEventListener("keydown", shiftKeyCallback);
      document.addEventListener("keyup", shiftKeyCallback);
    }
  }, [load, loaded, initialTree, setMarkers, shiftKeyCallback]);
  const filteredMarkers = useMemo(
    () =>
      filter
        ? markers.filter((m) =>
            isTagOnPage({ tag: filter, title: extractTag(m.tag) })
          )
        : markers,
    [markers, filter]
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
        <LayersControl position="bottomleft">
          <LayersControl.BaseLayer checked name="Streets">
            <TileLayer
              attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
              url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}"
              accessToken={process.env.MAPBOX_TOKEN}
              id="mapbox/streets-v11"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Outdoors">
            <TileLayer
              attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
              url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}"
              accessToken={process.env.MAPBOX_TOKEN}
              id="mapbox/outdoors-v11"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Light">
            <TileLayer
              attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
              url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}"
              accessToken={process.env.MAPBOX_TOKEN}
              id="mapbox/light-v10"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Dark">
            <TileLayer
              attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
              url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}"
              accessToken={process.env.MAPBOX_TOKEN}
              id="mapbox/dark-v10"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
              url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}"
              accessToken={process.env.MAPBOX_TOKEN}
              id="mapbox/satellite-v9"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <Markers href={href} markers={filteredMarkers} />
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
    )
    .catch(() => [NaN, NaN]);

export const render = (b: HTMLButtonElement): void => {
  const block = b.closest(".roam-block");
  if (!block) {
    return;
  }
  b.parentElement.onmousedown = (e: MouseEvent) => e.stopPropagation();
  ReactDOM.render(<Maps blockId={block.id} />, b.parentElement);
};

export default Maps;
