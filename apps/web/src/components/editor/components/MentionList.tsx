"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { User, MapPin, Shield, BookOpen, Compass, Skull, CreditCard, Sparkles } from "lucide-react";

export interface MentionPageItem {
  id: string;
  title: string;
  category: "character" | "location" | "item" | "faction" | "quest" | "other" | string;
  entityType?: "wiki" | "card";
  snippet?: string;
}

export interface MentionListProps {
  items: MentionPageItem[];
  command: (item: { id: string; label: string; entityType?: "wiki" | "card" }) => void;
}

const renderCategoryIcon = (category: string, entityType: "wiki" | "card" = "wiki") => {
  if (entityType === "card") {
    return <CreditCard className="h-3.5 w-3.5 text-sky-400" />;
  }
  switch (category) {
    case "character":
      return <User className="h-3.5 w-3.5 text-amber-400" />;
    case "location":
      return <MapPin className="h-3.5 w-3.5 text-emerald-400" />;
    case "item":
      return <Shield className="h-3.5 w-3.5 text-sky-400" />;
    case "faction":
      return <Compass className="h-3.5 w-3.5 text-purple-400" />;
    case "quest":
      return <Skull className="h-3.5 w-3.5 text-rose-400" />;
    default:
      return <BookOpen className="h-3.5 w-3.5 text-amber-400" />;
  }
};

export const MentionList = forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  MentionListProps
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({
        id: item.id,
        label: item.title,
        entityType: item.entityType || "wiki",
      });
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (props.items.length === 0) {
    return (
      <div className="z-50 w-80 rounded-xl border border-slate-800 bg-[#12151e] p-3 text-xs text-slate-400 shadow-2xl backdrop-blur-md">
        Nenhum artigo ou card encontrado para vincular...
      </div>
    );
  }

  // Segmenta itens em seções distintas: Artigos da Wiki e Cards da Campanha
  const wikiIndices: number[] = [];
  const cardIndices: number[] = [];

  props.items.forEach((item, index) => {
    if (item.entityType === "card") {
      cardIndices.push(index);
    } else {
      wikiIndices.push(index);
    }
  });

  const renderItemButton = (index: number) => {
    const item = props.items[index];
    const isSelected = index === selectedIndex;
    const isCard = item.entityType === "card";

    return (
      <button
        key={item.id}
        onClick={() => selectItem(index)}
        onMouseEnter={() => setSelectedIndex(index)}
        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
          isSelected
            ? isCard
              ? "bg-sky-500/20 text-white border border-sky-500/40"
              : "bg-amber-500/20 text-white border border-amber-500/40"
            : "text-slate-300 hover:bg-slate-800/60 border border-transparent"
        }`}
      >
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-md border shrink-0 ${
            isSelected
              ? isCard
                ? "border-sky-500/40 bg-sky-500/10"
                : "border-amber-500/40 bg-amber-500/10"
              : "border-slate-800 bg-[#181c28]"
          }`}
        >
          {renderCategoryIcon(item.category, item.entityType)}
        </div>
        <div className="flex-1 overflow-hidden min-w-0">
          <div className="font-medium text-slate-100 truncate text-xs">
            {item.title}
          </div>
          {item.snippet && (
            <div className="truncate text-[10px] text-slate-500">
              {item.snippet}
            </div>
          )}
        </div>
        <span
          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ${
            isCard
              ? "bg-sky-950/60 text-sky-400 border-sky-800/60"
              : "bg-amber-950/60 text-amber-400 border-amber-800/60"
          }`}
        >
          {isCard ? "CARD" : "WIKI"}
        </span>
      </button>
    );
  };

  return (
    <div className="z-50 max-h-80 w-84 overflow-y-auto rounded-xl border border-slate-700/80 bg-[#12151e]/95 p-1.5 shadow-2xl backdrop-blur-xl">
      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between border-b border-slate-800/80 mb-1">
        <span>Vincular Referência</span>
        <span className="text-[10px] text-amber-500/80 font-mono">@mencione</span>
      </div>

      <div className="space-y-2">
        {/* Sessão 1: Artigos da Wiki */}
        {wikiIndices.length > 0 && (
          <div className="space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5 bg-amber-500/10 rounded-md">
              <BookOpen className="h-3 w-3 text-amber-400" />
              <span>Artigos da Wiki ({wikiIndices.length})</span>
            </div>
            {wikiIndices.map((i) => renderItemButton(i))}
          </div>
        )}

        {/* Sessão 2: Cards da Campanha */}
        {cardIndices.length > 0 && (
          <div className="space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-sky-400/90 flex items-center gap-1.5 bg-sky-500/10 rounded-md">
              <CreditCard className="h-3 w-3 text-sky-400" />
              <span>Cards da Campanha ({cardIndices.length})</span>
            </div>
            {cardIndices.map((i) => renderItemButton(i))}
          </div>
        )}
      </div>
    </div>
  );
});

MentionList.displayName = "MentionList";
