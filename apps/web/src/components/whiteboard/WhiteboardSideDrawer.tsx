"use client";

import React from "react";
import Link from "next/link";
import { X, ExternalLink, CreditCard, Sparkles } from "lucide-react";
import { CardEditor } from "@/components/cards/CardEditor";

interface WhiteboardSideDrawerProps {
  card: any | null;
  projectId: string;
  tags: any[];
  allPages: any[];
  allCards: any[];
  onClose: () => void;
  onCardUpdated: (cardId: string, updatedData: any) => void;
  onTagsUpdated: (tags: any[]) => void;
}

export function WhiteboardSideDrawer({
  card,
  projectId,
  tags,
  allPages,
  allCards,
  onClose,
  onCardUpdated,
  onTagsUpdated,
}: WhiteboardSideDrawerProps) {
  if (!card) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 z-40 w-full sm:w-[580px] bg-[#0d0f14] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Topo do Drawer */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#141724] border-b border-slate-800 select-none shrink-0">
        <div className="flex items-center gap-2 truncate">
          <div className="p-1 rounded bg-sky-500/20 text-sky-400">
            <CreditCard className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-200 truncate">
            Edição Direta do Card no Board
          </span>
          <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
            • Alterações sincronizam relações automaticamente
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={`/project/${projectId}/cards/${card.id}`}
            target="_blank"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Abrir em nova aba"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Fechar painel lateral"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor Integrado Completo */}
      <div className="flex-1 overflow-hidden relative">
        <CardEditor
          cardId={card.id}
          projectId={projectId}
          cardTitle={card.title}
          category={card.category}
          tagId={card.tagId}
          tags={tags}
          allPages={allPages}
          allCards={allCards}
          initialContent={card.contentMarkdown}
          coverImage={card.coverImage}
          icon={card.icon}
          properties={card.properties}
          customFields={card.customFields}
          updatedAt={card.updatedAt}
          isWindowed={false}
          onCardUpdated={(newTitle, newCategory, newTagId) => {
            onCardUpdated(card.id, {
              title: newTitle,
              category: newCategory,
              tagId: newTagId,
            });
          }}
          onTagsUpdated={onTagsUpdated}
        />
      </div>
    </div>
  );
}
