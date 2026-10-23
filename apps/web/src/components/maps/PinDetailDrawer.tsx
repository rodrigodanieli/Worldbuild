"use client";

import React from "react";
import { 
  X, 
  BookOpen, 
  Layers, 
  MapPin, 
  Lock, 
  Tag, 
  ArrowRight,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { MapPinData } from "./fantasy-map-data";

export interface PinDetailDrawerProps {
  pin: MapPinData | null;
  onClose: () => void;
  onDrillDownMap?: (nestedMapId: string) => void;
}

export function PinDetailDrawer({ pin, onClose, onDrillDownMap }: PinDetailDrawerProps) {
  if (!pin) return null;

  return (
    <div className="absolute right-4 top-4 bottom-4 z-40 w-96 rounded-2xl border border-slate-700/80 bg-[#12151e]/95 p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between animate-in slide-in-from-right duration-200 select-none">
      <div>
        {/* Cabeçalho do Drawer */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span
              style={{ backgroundColor: `${pin.color}25`, color: pin.color, borderColor: `${pin.color}50` }}
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
            >
              {pin.category}
            </span>
            {pin.isSecret && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-900">
                <Lock className="h-3 w-3" />
                Segredo DM
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Título e Lore */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-1">
            <div
              style={{ backgroundColor: pin.color }}
              className="h-3 w-3 rounded-full"
            />
            <h3 className="text-xl font-bold text-white tracking-tight">
              {pin.title}
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {pin.description}
          </p>
        </div>

        {/* Coordenadas Cartográficas */}
        <div className="mt-4 p-2.5 rounded-xl bg-[#181c28] border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>Coordenadas 2D</span>
          <span className="text-amber-400">X: {pin.x} • Y: {pin.y}</span>
        </div>

        {/* Tags */}
        {pin.tags && pin.tags.length > 0 && (
          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Tags & Filtros
            </span>
            <div className="flex flex-wrap gap-1.5">
              {pin.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181c28] text-slate-300 border border-slate-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Artigo da Wiki Vinculado */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Artigo da Wiki Vinculado
          </span>
          <div className="p-3 rounded-xl bg-[#161a26] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <BookOpen className="h-4 w-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <div className="text-xs font-bold text-slate-200 truncate">
                  {pin.title}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  Página com notas, NPCs e lore completa
                </div>
              </div>
            </div>
            <Link
              href="/wiki"
              className="px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition flex items-center gap-1 shrink-0"
            >
              <span>Abrir</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Ações no Rodapé do Drawer */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        {pin.nestedMapId && (
          <button
            onClick={() => onDrillDownMap?.(pin.nestedMapId!)}
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-950/40 transition"
          >
            <Layers className="h-4 w-4" />
            <span>Explorar Submapa Deste Local</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}

        <Link
          href="/wiki"
          className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-950/40 transition"
        >
          <BookOpen className="h-4 w-4" />
          <span>Editar Documento da Wiki</span>
        </Link>
      </div>
    </div>
  );
}
