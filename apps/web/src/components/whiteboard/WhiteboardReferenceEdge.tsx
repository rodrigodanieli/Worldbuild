"use client";

import React, { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from "@xyflow/react";
import { Lock } from "lucide-react";

export const WhiteboardReferenceEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected,
  }: EdgeProps) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const label = (data?.label as string) || "Referência";
    const isField = data?.sourceType === "field";

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            stroke: selected ? "#38bdf8" : isField ? "#38bdf880" : "#f59e0b80",
            strokeWidth: selected ? 2.5 : 2,
            strokeDasharray: isField ? undefined : "5 5",
            ...style,
          }}
        />
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md shadow-lg transition select-none ${
                selected
                  ? "bg-slate-900 border-sky-400 text-sky-300 ring-2 ring-sky-400/20"
                  : isField
                  ? "bg-[#141724]/95 border-sky-500/30 text-sky-200"
                  : "bg-[#141724]/95 border-amber-500/30 text-amber-200"
              }`}
              title="🔒 Interligação gerada automaticamente por menção/campo. Não pode ser desfeita diretamente no board sem remover a referência no card."
            >
              <Lock className="h-2.5 w-2.5 text-amber-400 shrink-0" />
              <span className="truncate max-w-[140px]">{label}</span>
            </div>
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);

WhiteboardReferenceEdge.displayName = "WhiteboardReferenceEdge";
