"use client";

import React, { useState, useMemo } from "react";
import {
  CreditCard,
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Plus,
  Layers,
  Sparkles,
} from "lucide-react";

interface WhiteboardSidebarProps {
  cards: any[];
  pages: any[];
  tags: any[];
  onAddCardToCenter: (cardId: string) => void;
  onAddWikiToCenter: (pageId: string) => void;
  onCreateNewCard?: () => void;
  isCreatingCard?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function WhiteboardSidebar({
  cards,
  pages,
  tags,
  onAddCardToCenter,
  onAddWikiToCenter,
  onCreateNewCard,
  isCreatingCard,
  isCollapsed,
  onToggleCollapse,
}: WhiteboardSidebarProps) {
  const [activeTab, setActiveTab] = useState<"cards" | "wiki">("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | "all">("all");

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      const matchesSearch =
        c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag =
        selectedTagId === "all" ||
        c.tagId === selectedTagId ||
        c.category === tags.find((t) => t.id === selectedTagId)?.name;
      return matchesSearch && matchesTag;
    });
  }, [cards, searchTerm, selectedTagId, tags]);

  const filteredPages = useMemo(() => {
    return pages.filter((p) => {
      return (
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [pages, searchTerm]);

  return (
    <aside
      className={`h-full bg-[#121521] border-r border-slate-800/90 flex flex-col transition-all duration-300 select-none z-20 relative ${
        isCollapsed ? "w-12" : "w-72"
      }`}
    >
      {/* Botão de Colapsar / Expandir */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="absolute -right-3 top-6 z-30 h-6 w-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition"
        title={isCollapsed ? "Expandir barra de elementos" : "Recolher barra"}
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {isCollapsed ? (
        <div className="flex flex-col items-center py-6 space-y-4">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-2.5 rounded-xl bg-slate-800 text-sky-400 hover:bg-slate-700 transition"
            title="Cards da Campanha"
          >
            <CreditCard className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-2.5 rounded-xl bg-slate-800 text-amber-400 hover:bg-slate-700 transition"
            title="Wiki da Campanha"
          >
            <BookOpen className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Cabeçalho */}
          <div className="p-3.5 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-2.5">
              <Layers className="h-4 w-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Elementos do Mundo
              </h3>
            </div>

            {/* Campo de Busca */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cards ou artigos..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          {/* Abas: Cards vs Wiki */}
          <div className="flex border-b border-slate-800 px-2 pt-2 gap-1 bg-slate-950/40">
            <button
              type="button"
              onClick={() => setActiveTab("cards")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-t-lg transition border-b-2 ${
                activeTab === "cards"
                  ? "border-sky-400 text-sky-300 bg-slate-900/80"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Cards ({cards.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("wiki")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-t-lg transition border-b-2 ${
                activeTab === "wiki"
                  ? "border-amber-400 text-amber-300 bg-slate-900/80"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Wiki ({pages.length})</span>
            </button>
          </div>

          {/* Botão de Criar Novo Card */}
          {activeTab === "cards" && onCreateNewCard && (
            <div className="p-2 border-b border-slate-800/60 bg-slate-950/20">
              <button
                type="button"
                onClick={onCreateNewCard}
                disabled={isCreatingCard}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 hover:text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5 text-sky-400" />
                <span>{isCreatingCard ? "Criando Card..." : "+ Novo Card"}</span>
              </button>
            </div>
          )}

          {/* Filtro de Tags (quando na aba Cards) */}
          {activeTab === "cards" && tags.length > 0 && (
            <div className="p-2 border-b border-slate-800/80 flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedTagId("all")}
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap transition ${
                  selectedTagId === "all"
                    ? "bg-sky-500 text-black font-extrabold"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Todos
              </button>
              {tags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTagId(t.id)}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap transition border ${
                    selectedTagId === t.id
                      ? "bg-slate-800 border-white text-white font-extrabold"
                      : "border-transparent bg-slate-800/60 text-slate-300 hover:bg-slate-800"
                  }`}
                  style={{
                    borderColor: selectedTagId === t.id ? t.color : "transparent",
                    color: t.color,
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}

          {/* Dica de Arraste */}
          <div className="px-3 py-2 bg-sky-950/20 border-b border-slate-800/60 text-[10px] text-sky-300 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span>Arraste os itens para a tela para criar nós e conexões</span>
          </div>

          {/* Lista de Itens com Drag and Drop */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {activeTab === "cards" ? (
              filteredCards.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Nenhum card encontrado.
                </div>
              ) : (
                filteredCards.map((card) => {
                  const tag = tags.find((t) => t.id === card.tagId || t.name === card.category);
                  const color = tag?.color || "#38bdf8";

                  return (
                    <div
                      key={card.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          "application/worldbuild-board-item",
                          JSON.stringify({
                            type: "card",
                            id: card.id,
                            title: card.title,
                          })
                        );
                        e.dataTransfer.setData("text/plain", card.id);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      className="group p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/60 hover:bg-slate-800/70 transition flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing shadow-sm"
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <GripVertical className="h-3.5 w-3.5 text-slate-600 group-hover:text-sky-400 shrink-0" />
                        {card.icon ? (
                          <img
                            src={card.icon}
                            alt=""
                            className="h-6 w-6 rounded-md object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                            <CreditCard className="h-3 w-3" />
                          </div>
                        )}
                        <div className="truncate">
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate block">
                            {card.title}
                          </span>
                          <span
                            className="text-[9px] font-bold block truncate"
                            style={{ color }}
                          >
                            {card.category || card.tag?.name || "Card"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onAddCardToCenter(card.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-sky-300 hover:bg-slate-700/60 opacity-0 group-hover:opacity-100 transition shrink-0"
                        title="Adicionar ao centro do quadro"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )
            ) : filteredPages.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Nenhuma página da wiki encontrada.
              </div>
            ) : (
              filteredPages.map((page) => (
                <div
                  key={page.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      "application/worldbuild-board-item",
                      JSON.stringify({
                        type: "wiki",
                        id: page.id,
                        title: page.title,
                      })
                    );
                    e.dataTransfer.setData("text/plain", page.id);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className="group p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-800/70 transition flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing shadow-sm"
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <GripVertical className="h-3.5 w-3.5 text-slate-600 group-hover:text-amber-400 shrink-0" />
                    <div className="h-6 w-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <BookOpen className="h-3 w-3" />
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate block">
                        {page.title}
                      </span>
                      <span className="text-[9px] text-amber-400/80 block truncate">
                        {page.category || "Wiki"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddWikiToCenter(page.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-amber-300 hover:bg-slate-700/60 opacity-0 group-hover:opacity-100 transition shrink-0"
                    title="Adicionar ao centro do quadro"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
