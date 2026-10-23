"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { 
  MapPin, 
  User, 
  Shield, 
  Compass, 
  Lock, 
  BookOpen, 
  Sparkles,
  ExternalLink
} from "lucide-react";

export interface WorldNodeData {
  id: string;
  label: string;
  category: "location" | "character" | "item" | "faction" | "quest" | "secret";
  subtitle?: string;
  tags?: string[];
  isSecret?: boolean;
  linkCount?: number;
  [key: string]: any;
}

const getCategoryStyles = (category: string, isSecret?: boolean) => {
  if (isSecret) {
    return {
      border: "border-rose-500/50 hover:border-rose-400",
      bg: "bg-rose-950/25",
      headerBg: "bg-rose-950/60",
      iconBg: "bg-rose-900/40 text-rose-300",
      text: "text-rose-200",
      badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    };
  }

  switch (category) {
    case "location":
      return {
        border: "border-sky-500/40 hover:border-sky-400",
        bg: "bg-[#111928]/95",
        headerBg: "bg-sky-950/40",
        iconBg: "bg-sky-900/30 text-sky-400",
        text: "text-sky-100",
        badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
      };
    case "character":
      return {
        border: "border-amber-500/40 hover:border-amber-400",
        bg: "bg-[#1c1815]/95",
        headerBg: "bg-amber-950/40",
        iconBg: "bg-amber-900/30 text-amber-400",
        text: "text-amber-100",
        badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      };
    case "item":
      return {
        border: "border-emerald-500/40 hover:border-emerald-400",
        bg: "bg-[#121c17]/95",
        headerBg: "bg-emerald-950/40",
        iconBg: "bg-emerald-900/30 text-emerald-400",
        text: "text-emerald-100",
        badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      };
    case "faction":
      return {
        border: "border-purple-500/40 hover:border-purple-400",
        bg: "bg-[#191324]/95",
        headerBg: "bg-purple-950/40",
        iconBg: "bg-purple-900/30 text-purple-400",
        text: "text-purple-100",
        badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      };
    default:
      return {
        border: "border-slate-700 hover:border-slate-500",
        bg: "bg-[#141721]/95",
        headerBg: "bg-slate-800/40",
        iconBg: "bg-slate-800 text-slate-300",
        text: "text-slate-100",
        badge: "bg-slate-800 text-slate-300 border-slate-700",
      };
  }
};

const renderIcon = (category: string, isSecret?: boolean) => {
  if (isSecret) return <Lock className="h-4 w-4" />;
  switch (category) {
    case "location":
      return <MapPin className="h-4 w-4" />;
    case "character":
      return <User className="h-4 w-4" />;
    case "item":
      return <Shield className="h-4 w-4" />;
    case "faction":
      return <Compass className="h-4 w-4" />;
    default:
      return <BookOpen className="h-4 w-4" />;
  }
};

export const WorldNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WorldNodeData;
  const styles = getCategoryStyles(nodeData.category, nodeData.isSecret);

  return (
    <div
      className={`relative min-w-[200px] max-w-[260px] rounded-xl border backdrop-blur-md shadow-xl transition-all duration-150 cursor-pointer ${
        styles.bg
      } ${styles.border} ${
        selected ? "ring-2 ring-amber-400 shadow-amber-500/20 shadow-2xl scale-105" : ""
      }`}
    >
      {/* Handles para conexões em todas as direções */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-400 !w-2.5 !h-2.5 !border-2 !border-[#0d0f14]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-amber-500 !w-2.5 !h-2.5 !border-2 !border-[#0d0f14]"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-400 !w-2.5 !h-2.5 !border-2 !border-[#0d0f14]"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-amber-500 !w-2.5 !h-2.5 !border-2 !border-[#0d0f14]"
      />

      {/* Cabeçalho do Card */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl border-b border-slate-800/80 ${styles.headerBg}`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${styles.iconBg}`}>
            {renderIcon(nodeData.category, nodeData.isSecret)}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${styles.badge}`}>
            {nodeData.isSecret ? "Segredo DM" : nodeData.category}
          </span>
        </div>
        {nodeData.linkCount !== undefined && (
          <span className="text-[10px] text-slate-500 font-mono" title="Número de conexões">
            {nodeData.linkCount} elos
          </span>
        )}
      </div>

      {/* Conteúdo Principal do Card */}
      <div className="p-3">
        <h4 className={`font-bold text-sm tracking-tight truncate ${styles.text}`}>
          {nodeData.label}
        </h4>
        {nodeData.subtitle && (
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {nodeData.subtitle}
          </p>
        )}

        {/* Tags */}
        {nodeData.tags && nodeData.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-800/60">
            {nodeData.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

WorldNode.displayName = "WorldNode";
