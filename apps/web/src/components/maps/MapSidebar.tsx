"use client";

import React, { useState } from "react";
import { 
  MapPin, 
  Search, 
  Plus, 
  Lock, 
  ChevronRight, 
  Layers, 
  Map as MapIcon, 
  Compass, 
  Castle, 
  Skull,
  Beer
} from "lucide-react";
import { MapData, MapPinData } from "./fantasy-map-data";

export interface MapSidebarProps {
  maps: MapData[];
  currentMap: MapData;
  onSelectMap: (map: MapData) => void;
  selectedPin: MapPinData | null;
  onSelectPin: (pin: MapPinData) => void;
  isDmMode: boolean;
  isAddingPin: boolean;
  onToggleAddPin: () => void;
}

const renderCategoryIcon = (category: string) => {
  switch (category) {
    case "capital":
      return <Castle className="h-3.5 w-3.5 text-amber-400" />;
    case "dungeon":
      return <Skull className="h-3.5 w-3.5 text-rose-400" />;
    case "tavern":
      return <Beer className="h-3.5 w-3.5 text-emerald-400" />;
    default:
      return <MapPin className="h-3.5 w-3.5 text-sky-400" />;
  }
};

export function MapSidebar({
  maps,
  currentMap,
  onSelectMap,
  selectedPin,
  onSelectPin,
  isDmMode,
  isAddingPin,
  onToggleAddPin,
}: MapSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // Coleta todas as tags dos pinos do mapa atual
  const allTags = Array.from(
    new Set(currentMap.pins.flatMap((p) => p.tags))
  );

  // Filtra pinos
  const filteredPins = currentMap.pins.filter((pin) => {
    if (pin.isSecret && !isDmMode) return false;

    if (selectedTag !== "all" && !pin.tags.includes(selectedTag)) {
      return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        pin.title.toLowerCase().includes(q) ||
        pin.description.toLowerCase().includes(q) ||
        pin.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return true;
  });

  return (
    <aside className="w-80 h-full border-r border-slate-800/80 bg-[#12151e]/95 flex flex-col justify-between backdrop-blur-md select-none">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Seletor de Mapa (Hierarquia) */}
        <div className="p-3 border-b border-slate-800/80">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3 text-amber-400" />
              Hierarquia de Mapas
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {maps.length} camadas
            </span>
          </label>
          <div className="space-y-1">
            {maps.map((m) => {
              const isCurrent = m.id === currentMap.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMap(m)}
                  className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isCurrent
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapIcon className={`h-3.5 w-3.5 ${isCurrent ? "text-amber-400" : "text-slate-500"}`} />
                    <span className="truncate">{m.title}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    {m.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Barra de Busca de Pinos e Ação de Criar Pino */}
        <div className="p-3 border-b border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Marcadores no Mapa
            </span>
            <button
              onClick={onToggleAddPin}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition shadow-sm ${
                isAddingPin
                  ? "bg-rose-600 text-white animate-pulse"
                  : "bg-amber-600 hover:bg-amber-500 text-black"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isAddingPin ? "Cancelar" : "Novo Pino"}</span>
            </button>
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por nome ou lore..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#181c28] border border-slate-700/60 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Filtro por Tags */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              <button
                onClick={() => setSelectedTag("all")}
                className={`text-[10px] font-mono px-2 py-0.5 rounded transition ${
                  selectedTag === "all"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-slate-800/80 text-slate-400 hover:text-white"
                }`}
              >
                #todos
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded transition ${
                    selectedTag === tag
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-slate-800/80 text-slate-400 hover:text-white"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lista de Pinos do Mapa */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredPins.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              Nenhum marcador encontrado...
            </div>
          ) : (
            filteredPins.map((pin) => {
              const isSelected = selectedPin?.id === pin.id;
              return (
                <div
                  key={pin.id}
                  onClick={() => onSelectPin(pin)}
                  className={`group p-2.5 rounded-xl border text-left cursor-pointer transition flex items-start gap-2.5 ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-md"
                      : "border-slate-800/80 bg-[#161a26]/60 hover:border-slate-700 hover:bg-[#181d2a]"
                  }`}
                >
                  <div
                    style={{ backgroundColor: pin.color }}
                    className="h-6 w-6 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm"
                  >
                    {pin.isSecret ? <Lock className="h-3 w-3 text-white" /> : renderCategoryIcon(pin.category)}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-slate-100 truncate group-hover:text-amber-300">
                        {pin.title}
                      </h5>
                      {pin.isSecret && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-900">
                          DM
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {pin.description}
                    </p>
                    {pin.nestedMapId && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-sky-400 mt-1 font-semibold">
                        <span>Contém submapa</span>
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé da Sidebar de Mapas */}
        <div className="p-3 border-t border-slate-800/80 bg-[#10131b] flex items-center justify-between text-xs text-slate-500">
          <span>{filteredPins.length} pinos visíveis</span>
          <span className="text-amber-500/80 font-mono text-[10px]">Deep Zoom 14K</span>
        </div>
      </div>
    </aside>
  );
}
