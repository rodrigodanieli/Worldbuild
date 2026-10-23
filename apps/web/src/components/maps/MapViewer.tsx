"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapData, MapPinData } from "./fantasy-map-data";
import { generateMapSvgString } from "./map-svg-generator";

export interface MapViewerProps {
  currentMap: MapData;
  isDmMode: boolean;
  selectedPin: MapPinData | null;
  onSelectPin: (pin: MapPinData) => void;
  isAddingPin: boolean;
  onPinAdded: (coords: { x: number; y: number }) => void;
}

export function MapViewer({
  currentMap,
  isDmMode,
  selectedPin,
  onSelectPin,
  isAddingPin,
  onPinAdded,
}: MapViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Inicializa o mapa com Leaflet CRS.Simple (coordenadas 2D de fantasia)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const { width, height, backgroundSvgTheme } = currentMap;
    // Em Leaflet CRS.Simple: [[0, 0], [height, width]]
    const bounds: L.LatLngBoundsExpression = [
      [0, 0],
      [height, width],
    ];

    const map = L.map(mapContainerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -1.5,
      maxZoom: 3,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      attributionControl: false,
    });

    leafletMapRef.current = map;

    // Renderiza a camada vetorial do mapa de fantasia via ImageOverlay SVG
    const svgString = generateMapSvgString(backgroundSvgTheme, width, height);
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    L.imageOverlay(svgDataUrl, bounds).addTo(map);

    // Camada de Marcadores / Pinos
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Enquadra a visão inicial
    map.fitBounds(bounds);
    map.setMaxBounds([
      [-height * 0.2, -width * 0.2],
      [height * 1.2, width * 1.2],
    ]);

    // Clique no mapa para adicionar novo marcador
    map.on("click", (e: L.LeafletMouseEvent) => {
      const clickedY = Math.round(e.latlng.lat);
      const clickedX = Math.round(e.latlng.lng);

      if (clickedX >= 0 && clickedX <= width && clickedY >= 0 && clickedY <= height) {
        onPinAdded({ x: clickedX, y: clickedY });
      }
    });

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, [currentMap.id, currentMap.width, currentMap.height, currentMap.backgroundSvgTheme]);

  // Atualiza os marcadores/pinos no mapa
  useEffect(() => {
    const map = leafletMapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // Filtra pinos secretos se estiver no modo jogador
    const visiblePins = currentMap.pins.filter((pin) => {
      if (pin.isSecret && !isDmMode) return false;
      return true;
    });

    visiblePins.forEach((pin) => {
      // Leaflet CRS.Simple usa [Y, X]
      const latLng: L.LatLngExpression = [pin.y, pin.x];
      const isSelected = selectedPin?.id === pin.id;

      // Criação de HTML customizado para o pino com visual de RPG
      const iconHtml = `
        <div class="group relative flex items-center justify-center cursor-pointer transition-transform duration-150 ${
          isSelected ? "scale-125 z-50" : "hover:scale-110"
        }">
          ${
            pin.isSecret
              ? `<div class="absolute -inset-1.5 rounded-full bg-rose-500/40 animate-ping"></div>`
              : ""
          }
          <div style="background-color: ${pin.color};" class="relative h-8 w-8 rounded-full border-2 border-[#0d0f14] shadow-2xl flex items-center justify-center text-white font-bold text-xs ring-2 ring-black/40">
            ${pin.isSecret ? "🔒" : "📍"}
          </div>
          <div class="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-[#12151e]/95 text-[11px] font-semibold text-slate-100 border border-slate-700/80 shadow-2xl pointer-events-none">
            ${pin.title}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-map-pin",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(latLng, { icon: customIcon });

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectPin(pin);
        map.panTo(latLng, { animate: true });
      });

      markersLayer.addLayer(marker);
    });
  }, [currentMap.pins, isDmMode, selectedPin, onSelectPin]);

  // Se o usuário selecionou um pino pela barra lateral, foca nele
  useEffect(() => {
    if (selectedPin && leafletMapRef.current) {
      leafletMapRef.current.panTo([selectedPin.y, selectedPin.x], { animate: true });
    }
  }, [selectedPin]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#060911]">
      <div ref={mapContainerRef} className="h-full w-full z-0 cursor-grab active:cursor-grabbing" />

      {isAddingPin && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-950/90 px-4 py-1.5 text-xs font-semibold text-amber-200 shadow-2xl backdrop-blur-md animate-pulse">
          <span>📍 Clique em qualquer ponto do mapa para fixar o novo marcador</span>
        </div>
      )}
    </div>
  );
}
