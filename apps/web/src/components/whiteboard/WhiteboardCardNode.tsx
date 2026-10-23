"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { CreditCard, Edit3, Link2, Sparkles, User, ExternalLink } from "lucide-react";

export interface CardNodeData {
  id: string;
  title: string;
  category?: string;
  tagColor?: string;
  coverImage?: string | null;
  icon?: string | null;
  fieldsPreview?: Array<{ label: string; value: string }>;
  referenceCount?: number;
  onOpenDrawer?: (cardId: string) => void;
  onBringReferences?: (cardId: string) => void;
  [key: string]: any;
}

export const WhiteboardCardNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as CardNodeData;
  const tagColor = nodeData.tagColor || "#38bdf8";

  return (
    <div
      className={`w-64 rounded-2xl bg-[#141724] border transition-all duration-200 shadow-xl overflow-hidden group select-none ${
        selected
          ? "border-sky-400 shadow-sky-950/50 shadow-2xl ring-2 ring-sky-400/30"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Handles para Interligação por menções e referências (Conexão bidirecional em todas as pontas) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-[#141724] hover:!scale-125 transition z-10"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-src"
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-[#141724] hover:!scale-125 transition z-20"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-[#141724] hover:!scale-125 transition z-10"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-src"
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-[#141724] hover:!scale-125 transition z-20"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-[#141724] hover:!scale-125 transition z-10"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-src"
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-[#141724] hover:!scale-125 transition z-20"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-[#141724] hover:!scale-125 transition z-10"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-src"
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-[#141724] hover:!scale-125 transition z-20"
      />

      {/* Capa / Banner do Card */}
      <div className="relative h-16 w-full bg-slate-900 overflow-hidden">
        {nodeData.coverImage ? (
          <img
            src={nodeData.coverImage}
            alt="Capa"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div
            className="w-full h-full opacity-40"
            style={{
              background: `linear-gradient(135deg, ${tagColor}40 0%, #0d0f14 100%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141724] via-transparent to-black/20" />

        {/* Tag Pill */}
        <div className="absolute top-2 left-2 z-10">
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-sm backdrop-blur-sm"
            style={{
              backgroundColor: `${tagColor}20`,
              borderColor: `${tagColor}60`,
              color: tagColor,
            }}
          >
            {nodeData.category || "Card"}
          </span>
        </div>

        {/* Botão de Ação Rápida de Edição */}
        {nodeData.onOpenDrawer && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nodeData.onOpenDrawer?.(nodeData.id);
            }}
            className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 hover:bg-sky-600 text-white opacity-0 group-hover:opacity-100 transition shadow"
            title="Abrir e Editar Card na Lateral"
          >
            <Edit3 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Corpo do Nó */}
      <div className="p-3 pt-1">
        {/* Avatar e Título */}
        <div className="flex items-start gap-2.5 mb-2">
          {nodeData.icon ? (
            <div className="relative -mt-4 h-9 w-9 rounded-xl overflow-hidden border-2 border-[#141724] shadow-md shrink-0 bg-slate-800">
              <img src={nodeData.icon} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="relative -mt-4 h-9 w-9 rounded-xl overflow-hidden border-2 border-[#141724] shadow-md shrink-0 bg-slate-800 flex items-center justify-center text-slate-400">
              <CreditCard className="h-4 w-4" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4
              onClick={() => nodeData.onOpenDrawer?.(nodeData.id)}
              className="text-xs font-bold text-white hover:text-sky-300 transition truncate cursor-pointer"
              title={nodeData.title}
            >
              {nodeData.title || "Sem título"}
            </h4>
            <span className="text-[10px] text-slate-500 block truncate">
              ID: {nodeData.id.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Preview de Campos Principais */}
        {nodeData.fieldsPreview && nodeData.fieldsPreview.length > 0 && (
          <div className="space-y-1 mb-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 text-[11px]">
            {nodeData.fieldsPreview.slice(0, 2).map((fp, i) => (
              <div key={i} className="flex items-center justify-between gap-1 truncate">
                <span className="text-slate-400 text-[10px] truncate">{fp.label}:</span>
                <span className="text-slate-200 font-medium text-[10px] truncate max-w-[120px]">
                  {fp.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Rodapé do Nó: Referências e Botão de Expandir Conexões */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Link2 className="h-3 w-3 text-amber-400" />
            <span>
              {nodeData.referenceCount ?? 0} conexõ{(nodeData.referenceCount ?? 0) === 1 ? "o" : "es"}
            </span>
          </span>

          {nodeData.onBringReferences && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onBringReferences?.(nodeData.id);
              }}
              className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold transition px-1.5 py-0.5 rounded hover:bg-sky-500/10"
              title="Trazer referências vinculadas para o whiteboard"
            >
              <Sparkles className="h-2.5 w-2.5" />
              <span>Expandir</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

WhiteboardCardNode.displayName = "WhiteboardCardNode";
