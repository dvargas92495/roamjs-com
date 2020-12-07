import React from "react";
import dynamic from "next/dynamic";

const DemoMaps = () => {
  process.env.MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const Map = dynamic(() => import("../src/components/Maps"), { ssr: false });
  return <Map blockId="demo" />;
};

export default DemoMaps;
