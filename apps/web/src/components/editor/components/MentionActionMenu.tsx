"use client";

import React, { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Eye, ArrowRight, X, FileText, CreditCard } from "lucide-react";

export interface MentionActionMenuProps {
  position: { top: number; left: number };
  pageId: string;
  pageTitle: string;
  entityType?: "wiki" | "card";
  projectId: string;
  onClose: () => void;
  onOpenPreview: (pageId: string, pageTitle: string, entityType?: "wiki" | "card") => void;
}

export function MentionActionMenu({
  position,
  pageId,
  pageTitle,
  entityType = "wiki",
  projectId,
  onClose,
  onOpenPreview,
}: MentionActionMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const isCard = entityType === "card";
  const targetUrl = isCard
    ? `/project/${projectId}/cards/${pageId}`
    : `/project/${projectId}/wiki/${pageId}`;

  const handleOpenCurrent = () => {
    onClose();
    router.push(targetUrl);
  };

  const handleOpenNewTab = () => {
    onClose();
    window.open(targetUrl, "_blank");
  };

  const handlePreview = () => {
    onClose();
    onOpenPreview(pageId, pageTitle, entityType);
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 -translate-x-1/2 w-64 rounded-xl bg-[#141721]/95 border border-slate-700/80 shadow-2xl p-1.5 text-xs text-slate-200 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400">
        <span className="flex items-center gap-1.5 truncate">
          {isCard ? (
            <CreditCard className="h-3.5 w-3.5 text-sky-400 shrink-0" />
          ) : (
            <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          )}
          <span className="truncate">{pageTitle}</span>
          <span
            className={`text-[9px] font-mono px-1 py-0.2 rounded border uppercase ml-1 ${
              isCard
                ? "bg-sky-950/70 text-sky-300 border-sky-800/60"
                : "bg-amber-950/70 text-amber-300 border-amber-800/60"
            }`}
          >
            {isCard ? "CARD" : "WIKI"}
          </span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="p-1 space-y-0.5">
        {/* 1. Abrir na página atual */}
        <button
          type="button"
          onClick={handleOpenCurrent}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-800/80 hover:text-white transition group"
        >
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400" />
          <span>Abrir na página atual</span>
        </button>

        {/* 2. Abrir em nova guia */}
        <button
          type="button"
          onClick={handleOpenNewTab}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-800/80 hover:text-white transition group"
        >
          <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-400" />
          <span>Abrir em nova guia</span>
        </button>

        {/* 3. Abrir em pop-up (leitura rápida) */}
        <button
          type="button"
          onClick={handlePreview}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-800/80 hover:text-white transition group"
        >
          <Eye className="h-3.5 w-3.5 text-slate-400 group-hover:text-purple-400" />
          <span>Visualizar em pop-up (Leitura)</span>
        </button>
      </div>
    </div>
  );
}
