import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import {
  addStyle,
  extractTag,
  getParseRoamMarked,
  isTagOnPage,
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
import { render as renderAlias } from "./AliasPreview";
import getUidsFromId from "roamjs-components/dom/getUidsFromId";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import { TreeNode } from "roamjs-components/types/native";
import openBlockInSidebar from "roamjs-components/writes/openBlockInSidebar";
import setInputSetting from "roamjs-components/util/setInputSetting";

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

type RoamMarker = { x: number; y: number; tag: string; uid: string };

const COORDS_REGEX =
  /((?:-?)(?:0|(?:[1-9][0-9]*))(?:\.[0-9]+)?),(?:\s)?((?:-?)(?:0|(?:[1-9][0-9]*))(?:\.[0-9]+)?)/;
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
            uid: m.uid,
          }));
        })
      ).then((markers) => markers.filter(({ x, y }) => !isNaN(x) && !isNaN(y)))
    : Promise.resolve([] as RoamMarker[]);
};

const Markers = ({
  id,
  markers,
}: {
  id: string;
  href: string;
  markers: RoamMarker[];
}) => {
  const map = useMap();
  const mouseRef = useRef(null);
  const openMarker = (marker: LMarker) => () => {
    mouseRef.current = marker;
    marker.openPopup();
  };
  const closeMarker = (marker: LMarker) => () => {
    mouseRef.current = null;
    setTimeout(() => {
      if (mouseRef.current !== marker) {
        marker.closePopup();
      }
    }, 100);
  };
  const parseRoamMarked =
    useRef<Awaited<ReturnType<typeof getParseRoamMarked>>>();
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore until there's a better way to grab markers
    const leafletMarkers = map._layers as { [key: string]: LMarker };
    Object.keys(leafletMarkers).forEach((k) => {
      const m = leafletMarkers[k];
      m.on({
        mouseover: openMarker(m),
        mouseout: closeMarker(m),
        click: (e) => {
          const extractedTag = extractTag(m.options.title);
          const pageUid = getPageUidByPageTitle(extractedTag);
          if (pageUid) {
            if (e.originalEvent.shiftKey) {
              openBlockInSidebar(pageUid);
            } else {
              window.roamAlphaAPI.ui.mainWindow.openPage({
                page: { uid: pageUid },
              });
            }
          }
        },
      });
    });
    const observer = new MutationObserver((mrs) => {
      mrs
        .flatMap((mr) => Array.from(mr.addedNodes))
        .filter((n) => n.nodeName === "DIV")
        .map((n) => n as HTMLDivElement)
        .map((n) =>
          n.classList.contains("leaflet-popup")
            ? n
            : n.getElementsByClassName("leaflet-popup")[0]
        )
        .filter((n) => !!n)
        .forEach((n) => {
          const marker = Object.values(leafletMarkers).find(
            (m) =>
              n
                .querySelector(".roamjs-marker-data")
                .getAttribute("data-uid") === m.options.title
          );
          n.addEventListener("mouseenter", openMarker(marker));
          n.addEventListener("mouseleave", closeMarker(marker));
        });
      mrs
        .flatMap((mr) => Array.from(mr.addedNodes))
        .map((n) =>
          n.parentElement.querySelector<HTMLAnchorElement>(".rm-alias")
        )
        .filter((n) => !!n)
        .forEach((anchor) => {
          renderAlias({
            p: anchor,
            children: anchor.innerText,
            blockUid: anchor.href.match(/\/page\/(.*)/)?.[1] || "",
          });
        });
    });
    observer.observe(document.getElementById(id), {
      childList: true,
      subtree: true,
    });
    getParseRoamMarked().then((f) => (parseRoamMarked.current = f));
    return () => observer.disconnect();
  }, []);
  return (
    <>
      {markers.map((m, i) => (
        <Marker
          position={[m.x, m.y]}
          icon={MarkerIcon}
          key={i}
          title={m.uid}
          riseOnHover
        >
          <Popup>
            <div
              className={"roamjs-marker-data roamjs-block-view"}
              id={`roamjs-map-marker-${m.uid}`}
              data-uid={m.uid}
              style={{ display: "flex" }}
              dangerouslySetInnerHTML={{
                __html: parseRoamMarked.current(m.tag),
              }}
            />
          </Popup>
        </Marker>
      ))}
    </>
  );
};

const DEFAULT_HEIGHT = 400;
const Maps = ({ blockId }: { blockId: string }): JSX.Element => {
  const id = useMemo(() => `roamjs-maps-container-id-${blockId}`, [blockId]);
  const mapInstance = useRef<Map>(null);
  const initialTree = useTreeByHtmlId(blockId);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const fixHeight = useCallback(() => {
    setHeight(
      parseInt(
        getComputedStyle(document.getElementById(id)).width.match(
          /^(.*)px$/
        )?.[1] || `${Math.round((DEFAULT_HEIGHT * 4) / 3)}`
      ) * 0.75
    );
    mapInstance.current?.invalidateSize?.();
  }, [setHeight]);
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
    fixHeight();
  }, [mapInstance, setMarkers, blockId, fixHeight]);

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
      fixHeight();
    }
  }, [load, loaded, initialTree, setMarkers, shiftKeyCallback, id, fixHeight]);
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
  const whenCreated = useCallback(
    (m) => {
      mapInstance.current = m;
      mapInstance.current.invalidateSize();
    },
    [mapInstance]
  );
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
        style={{ height }}
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
        <Markers href={href} markers={filteredMarkers} id={id} />
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
