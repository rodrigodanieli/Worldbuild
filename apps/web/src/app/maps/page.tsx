"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { 
  ArrowLeft, 
  Map as MapIcon, 
  BookOpen, 
  Network, 
  Lock, 
  Eye, 
  EyeOff, 
  Layers, 
  ChevronRight,
  Plus
} from "lucide-react";
import { MAPS_DATABASE, MapData, MapPinData } from "@/components/maps/fantasy-map-data";
import { MapSidebar } from "@/components/maps/MapSidebar";
import { PinDetailDrawer } from "@/components/maps/PinDetailDrawer";
import { NewPinModal } from "@/components/maps/NewPinModal";

// Importação dinâmica do MapViewer sem SSR para compatibilidade com o Leaflet
const DynamicMapViewer = dynamic(
  () => import("@/components/maps/MapViewer").then((mod) => mod.MapViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#060911] text-slate-500 text-sm">
        Carregando motor cartográfico Leaflet...
      </div>
    ),
  }
);

export default function MapsPage(): React.JSX.Element {
  const [maps, setMaps] = useState<MapData[]>(MAPS_DATABASE);
  const [currentMap, setCurrentMap] = useState<MapData>(MAPS_DATABASE[0]);
  const [selectedPin, setSelectedPin] = useState<MapPinData | null>(null);
  const [isDmMode, setIsDmMode] = useState<boolean>(true);
  const [isAddingPin, setIsAddingPin] = useState<boolean>(false);
  const [pendingCoords, setPendingCoords] = useState<{ x: number; y: number } | null>(null);

  const handleSelectMap = (map: MapData) => {
    setCurrentMap(map);
    setSelectedPin(null);
  };

  const handleDrillDownMap = (nestedMapId: string) => {
    const targetMap = maps.find((m) => m.id === nestedMapId);
    if (targetMap) {
      setCurrentMap(targetMap);
      setSelectedPin(null);
    }
  };

  const handlePinAdded = (coords: { x: number; y: number }) => {
    if (!isAddingPin) return;
    setPendingCoords(coords);
  };

  const handleSaveNewPin = (newPinData: Omit<MapPinData, "id">) => {
    const newPin: MapPinData = {
      id: `pin-${Date.now()}`,
      ...newPinData,
    };

    const updatedMaps = maps.map((m) => {
      if (m.id === currentMap.id) {
        return {
          ...m,
          pins: [...m.pins, newPin],
        };
      }
      return m;
    });

    setMaps(updatedMaps);
    setCurrentMap((prev) => ({
      ...prev,
      pins: [...prev.pins, newPin],
    }));

    setPendingCoords(null);
    setIsAddingPin(false);
    setSelectedPin(newPin);
  };

  // Breadcrumb para mapas aninhados
  const parentMap = currentMap.parentMapId
    ? maps.find((m) => m.id === currentMap.parentMapId)
    : null;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0d0f14]">
      {/* Barra de Navegação Superior */}
      <header className="z-20 flex h-14 items-center justify-between border-b border-slate-800/80 bg-[#12151e]/95 px-5 backdrop-blur-md select-none">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Hub</span>
          </Link>

          <span className="text-slate-700">/</span>

          {/* Breadcrumb de Mapas Aninhados */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <MapIcon className="h-4 w-4" />
            </div>

            {parentMap && (
              <>
                <button
                  onClick={() => handleSelectMap(parentMap)}
                  className="text-xs text-slate-400 hover:text-amber-300 transition"
                >
                  {parentMap.title}
                </button>
                <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
              </>
            )}

            <h1 className="text-sm font-bold text-white tracking-wide">
              {currentMap.title}
            </h1>
          </div>
        </div>

        {/* Controles de Segredos DM e Atalhos de Navegação */}
        <div className="flex items-center gap-2.5">
          {/* Botão de Toggle DM vs Jogador */}
          <button
            onClick={() => setIsDmMode(!isDmMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm ${
              isDmMode
                ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                : "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
            }`}
            title="Oculta ou revela marcadores secretos no mapa"
          >
            {isDmMode ? (
              <>
                <Eye className="h-3.5 w-3.5 text-rose-400" />
                <span>Modo Mestre (Pinos Secretos ON)</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-emerald-400" />
                <span>Modo Jogador (Sem Segredos)</span>
              </>
            )}
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          <Link
            href="/mindmap"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-[#181c28] hover:border-sky-500/40 text-xs font-semibold text-slate-300 transition"
          >
            <Network className="h-3.5 w-3.5 text-sky-400" />
            <span>Ver no Grafo</span>
          </Link>

          <Link
            href="/wiki"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-[#181c28] hover:border-amber-500/40 text-xs font-semibold text-slate-300 transition"
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            <span>Editor Wiki</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal do Módulo de Mapas */}
      <div className="flex flex-1 w-full h-full overflow-hidden relative">
        {/* Barra Lateral de Pinos e Hierarquia */}
        <MapSidebar
          maps={maps}
          currentMap={currentMap}
          onSelectMap={handleSelectMap}
          selectedPin={selectedPin}
          onSelectPin={setSelectedPin}
          isDmMode={isDmMode}
          isAddingPin={isAddingPin}
          onToggleAddPin={() => setIsAddingPin(!isAddingPin)}
        />

        {/* Canvas de Mapa Leaflet */}
        <main className="flex-1 h-full relative">
          <DynamicMapViewer
            currentMap={currentMap}
            isDmMode={isDmMode}
            selectedPin={selectedPin}
            onSelectPin={setSelectedPin}
            isAddingPin={isAddingPin}
            onPinAdded={handlePinAdded}
          />

          {/* Drawer Lateral com Detalhes do Marcador Selecionado */}
          <PinDetailDrawer
            pin={selectedPin}
            onClose={() => setSelectedPin(null)}
            onDrillDownMap={handleDrillDownMap}
          />
        </main>
      </div>

      {/* Modal para Adicionar Novo Pino */}
      {pendingCoords && (
        <NewPinModal
          coords={pendingCoords}
          onClose={() => setPendingCoords(null)}
          onSave={handleSaveNewPin}
        />
      )}
    </div>
  );
}
