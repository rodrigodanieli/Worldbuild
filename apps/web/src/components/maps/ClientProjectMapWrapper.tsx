"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { MapData } from "./fantasy-map-data";

const DynamicMapViewer = dynamic(
  () => import("./MapViewer").then((mod) => mod.MapViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#060911] text-slate-500 text-sm">
        Carregando motor cartográfico Leaflet...
      </div>
    ),
  }
);

interface ClientProjectMapWrapperProps {
  initialMap: MapData;
}

export function ClientProjectMapWrapper({ initialMap }: ClientProjectMapWrapperProps): React.JSX.Element {
  const [currentMap, setCurrentMap] = useState<MapData>(initialMap);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  const selectedPin = currentMap.pins.find((p) => p.id === selectedPinId) || null;

  return (
    <div className="w-full h-full relative">
      <DynamicMapViewer
        currentMap={currentMap}
        isDmMode={true}
        selectedPin={selectedPin}
        onSelectPin={(pin) => setSelectedPinId(pin ? pin.id : null)}
        isAddingPin={false}
        onPinAdded={() => {}}
      />
    </div>
  );
}
