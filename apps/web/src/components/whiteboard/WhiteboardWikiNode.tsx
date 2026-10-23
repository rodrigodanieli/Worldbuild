"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { BookOpen, ExternalLink } from "lucide-react";

export interface WikiNodeData {
  id: string;
  title: string;
  category?: string;
  snippet?: string;
  onOpenWiki?: (pageId: string) => void;
  [key: string]: any;
}

export const WhiteboardWikiNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as WikiNodeData;

  return (
    <div
      className={`w-60 rounded-2xl bg-[#141724] border transition-all duration-200 shadow-xl overflow-hidden group select-none ${
        selected
          ? "border-amber-400 shadow-amber-950/50 shadow-2xl ring-2 ring-amber-400/30"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Handles para Interligação (Bidirecional em todas as pontas) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#141724] hover:!scale-125 transition z-10"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-src"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#141724] hover:!scale-125 transition z-20"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#141724] hover:!scale-125 transition z-10"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-src"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#141724] hover:!scale-125 transition z-20"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#141724] hover:!scale-125 transition z-10"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-src"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#141724] hover:!scale-125 transition z-20"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#141724] hover:!scale-125 transition z-10"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-src"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#141724] hover:!scale-125 transition z-20"
      />

      {/* Topo do Nó Wiki */}
      <div className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 truncate">
            {nodeData.category || "Artigo da Wiki"}
          </span>
        </div>

        {nodeData.onOpenWiki && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nodeData.onOpenWiki?.(nodeData.id);
            }}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Abrir Página da Wiki"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-3">
        <h4
          onClick={() => nodeData.onOpenWiki?.(nodeData.id)}
          className="text-xs font-bold text-white hover:text-amber-300 transition truncate cursor-pointer"
          title={nodeData.title}
        >
          {nodeData.title || "Sem título"}
        </h4>
        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {nodeData.snippet || "Artigo documentado da campanha na Wiki do mundo."}
        </p>
      </div>
    </div>
  );
});

WhiteboardWikiNode.displayName = "WhiteboardWikiNode";
