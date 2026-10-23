"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CardsSidebar, CardItem } from "./CardsSidebar";
import { CardEditor } from "./CardEditor";
import { CardTagItem } from "./ManageTagsModal";
import {
  LayoutGrid,
  Columns2,
  Maximize2,
  X,
  Split,
  Plus,
  Layers,
  Sparkles,
} from "lucide-react";

export interface CardData {
  id: string;
  title: string;
  category: string;
  tagId?: string | null;
  coverImage?: string | null;
  icon?: string | null;
  contentMarkdown: string;
  contentJson: string;
  tags: string;
  properties: string;
  customFields?: string;
  updatedAt: string;
  createdAt: string;
  owner: { id: string; name: string; email: string };
}

export interface CardsClientContainerProps {
  projectId: string;
  projectName: string;
  initialCards: CardItem[];
  initialTags?: CardTagItem[];
  allPages: { id: string; title: string; category?: string }[];
  card: CardData;
  isOwner: boolean;
}

export function CardsClientContainer({
  projectId,
  projectName,
  initialCards,
  initialTags = [],
  allPages,
  card,
  isOwner,
}: CardsClientContainerProps) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [cards, setCards] = useState<CardItem[]>(initialCards);
  const [tags, setTags] = useState<CardTagItem[]>(initialTags);

  // Estado das janelas ativas (1 até 4 cards simultâneos na área de trabalho)
  const [openCards, setOpenCards] = useState<CardData[]>([card]);

  // Estado para feedback de arrastar e soltar (Drag and Drop estilo Windows 11)
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Carrega tags atualizadas do banco SQLite
  useEffect(() => {
    async function loadTags() {
      try {
        const res = await fetch(`/api/cards/tags?worldId=${projectId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.tags && data.tags.length > 0) {
            setTags(data.tags);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar tags do projeto:", err);
      }
    }
    loadTags();
  }, [projectId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // 1. Ao clicar em um card da barra lateral, ele abre em TELA CHEIA por inteiro
  const handleOpenCardFull = async (cardItem: CardItem) => {
    // Se o card já estiver carregado em openCards, define apenas ele
    const existing = openCards.find((c) => c.id === cardItem.id);
    if (existing) {
      setOpenCards([existing]);
      window.history.replaceState(null, "", `/project/${projectId}/cards/${cardItem.id}`);
      return;
    }

    try {
      const res = await fetch(`/api/cards/${cardItem.id}`);
      if (!res.ok) throw new Error("Erro ao carregar dados do card");
      const { card: loadedCard } = await res.json();
      setOpenCards([loadedCard]);
      window.history.replaceState(null, "", `/project/${projectId}/cards/${cardItem.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Ao arrastar ou clicar no botão de divisão, adiciona o card à grade (até 4 janelas)
  const handleAddCardSplit = async (cardItem: CardItem) => {
    if (openCards.some((c) => c.id === cardItem.id)) {
      showToast(`O card "${cardItem.title}" já está aberto na tela.`);
      return;
    }

    if (openCards.length >= 4) {
      showToast("Limite máximo de 4 janelas atingido. Feche uma janela para abrir outro card.");
      return;
    }

    try {
      const res = await fetch(`/api/cards/${cardItem.id}`);
      if (!res.ok) throw new Error("Erro ao carregar card para divisão");
      const { card: loadedCard } = await res.json();

      const nextCards = [...openCards, loadedCard];
      setOpenCards(nextCards);

      const count = nextCards.length;
      if (count === 2) {
        showToast("Tela dividida em 2 colunas!");
      } else if (count === 3) {
        showToast("Layout 3 janelas: 1 coluna lateral completa + 2 empilhadas!");
      } else if (count === 4) {
        showToast("Layout 4 janelas: Grade 2x2 ativada!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Fechar uma das janelas
  const handleCloseWindow = (cardId: string) => {
    if (openCards.length <= 1) {
      showToast("Pelo menos 1 card deve permanecer aberto.");
      return;
    }
    const filtered = openCards.filter((c) => c.id !== cardId);
    setOpenCards(filtered);
    window.history.replaceState(null, "", `/project/${projectId}/cards/${filtered[0].id}`);
  };

  // 4. Maximizar uma janela específica em tela cheia
  const handleMaximizeWindow = (targetCard: CardData) => {
    setOpenCards([targetCard]);
    window.history.replaceState(null, "", `/project/${projectId}/cards/${targetCard.id}`);
    showToast(`"${targetCard.title}" maximizado em tela cheia.`);
  };

  // 5. Tratamento de Drag & Drop (arrastar do menu lateral para a área central)
  const handleDragOver = (e: React.DragEvent) => {
    // Só ativa o overlay de divisão se for um card sendo arrastado da sidebar (não campos internos)
    const types = Array.from(e.dataTransfer.types || []).map((t) => t.toLowerCase());
    const isSidebarCardDrag =
      types.includes("application/worldbuild-card") ||
      types.includes("cardid");

    if (!isSidebarCardDrag) {
      return;
    }

    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!isDraggingOver) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    // Se não for um card da sidebar, ignora e não fecha o drop
    const cardId =
      e.dataTransfer.getData("application/worldbuild-card") ||
      e.dataTransfer.getData("cardId");

    if (!cardId) {
      setIsDraggingOver(false);
      return;
    }

    e.preventDefault();
    setIsDraggingOver(false);

    const foundItem = cards.find((c) => c.id === cardId);
    if (foundItem) {
      await handleAddCardSplit(foundItem);
    }
  };

  // Determina classe do layout do grid de acordo com o número de janelas abertas
  const numWindows = openCards.length;

  const getContainerGridClass = () => {
    if (numWindows === 1) return "flex flex-col h-full w-full p-2";
    if (numWindows === 2) return "grid grid-cols-2 grid-rows-1 h-full w-full gap-2 p-2";
    // 3 cards: 1 coluna completa que ocupa os 2 grids verticais + 1 grid em cima e outro embaixo
    if (numWindows === 3) return "grid grid-cols-2 grid-rows-2 h-full w-full gap-2 p-2";
    // 4 cards: 2 em cima e 2 embaixo (grade 2x2)
    return "grid grid-cols-2 grid-rows-2 h-full w-full gap-2 p-2";
  };

  const getItemSpanClass = (index: number) => {
    if (numWindows === 1) return "h-full w-full";
    if (numWindows === 2) return "col-span-1 h-full overflow-hidden";
    if (numWindows === 3) {
      // 1ª janela ocupa as 2 linhas da coluna esquerda (row-span-2)
      if (index === 0) return "col-span-1 row-span-2 h-full overflow-hidden";
      // 2ª e 3ª janelas ocupam a coluna direita (1 em cima e 1 embaixo)
      return "col-span-1 row-span-1 h-full overflow-hidden";
    }
    // 4 janelas: cada uma ocupa 1 quadrante na grade 2x2
    return "col-span-1 row-span-1 h-full overflow-hidden";
  };

  return (
    <div className="flex flex-1 w-full h-full overflow-hidden relative">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141824] border border-sky-500/50 text-slate-100 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="h-4 w-4 text-sky-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Sidebar Plana de Cards com suporte a Arrastar (Drag and Drop) */}
      <div
        className={`transition-all duration-300 ease-in-out h-full flex shrink-0 ${
          isSidebarCollapsed
            ? "-ml-72 w-72 opacity-0 pointer-events-none"
            : "ml-0 w-72 opacity-100"
        }`}
      >
        <CardsSidebar
          projectId={projectId}
          cards={cards}
          openCardIds={openCards.map((c) => c.id)}
          tags={tags}
          isOwner={isOwner}
          onOpenCardFull={handleOpenCardFull}
          onAddCardSplit={handleAddCardSplit}
          onTagsUpdated={(newTags) => setTags(newTags)}
          onCollapseSidebar={handleToggleSidebar}
        />
      </div>

      {/* 2. Área Central de Trabalho - Gerenciador de Janelas Estilo Windows 11 */}
      <main
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex-1 h-full overflow-hidden flex flex-col min-w-0 bg-[#0a0c10] relative"
      >
        {/* Barra superior de status do Gerenciador de Janelas */}
        <div className="h-8 border-b border-slate-800/80 bg-[#0f1118] px-3 flex items-center justify-between text-[11px] text-slate-400 select-none shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5 text-sky-400" />
              <span>Gerenciador de Janelas</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-mono text-[10px]">
              {numWindows} de 4 janelas ativas
            </span>
          </div>

          {/* Mini Indicador de Snap Layout ativo */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 hidden sm:inline">Layout:</span>
            <div className="flex items-center gap-1 bg-[#161a26] border border-slate-700/60 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => setOpenCards((prev) => prev.slice(0, 1))}
                className={`p-1 rounded transition ${numWindows === 1 ? "bg-sky-500/20 text-sky-400" : "text-slate-500 hover:text-slate-300"}`}
                title="1 Janela (Tela Cheia)"
              >
                <div className="w-3 h-3 border border-current rounded-sm" />
              </button>
              <button
                type="button"
                disabled={cards.length < 2}
                onClick={() => {
                  if (numWindows < 2 && cards.length >= 2) {
                    const second = cards.find((c) => c.id !== openCards[0].id) || cards[1];
                    handleAddCardSplit(second);
                  }
                }}
                className={`p-1 rounded transition ${numWindows === 2 ? "bg-sky-500/20 text-sky-400" : "text-slate-500 hover:text-slate-300"}`}
                title="2 Colunas (50% / 50%)"
              >
                <div className="w-3 h-3 flex gap-0.5">
                  <div className="w-1.5 h-full border border-current rounded-sm" />
                  <div className="w-1.5 h-full border border-current rounded-sm" />
                </div>
              </button>
              <button
                type="button"
                disabled={cards.length < 3}
                className={`p-1 rounded transition ${numWindows === 3 ? "bg-sky-500/20 text-sky-400" : "text-slate-500"}`}
                title="3 Janelas (1 Coluna + 2 Empilhadas)"
              >
                <div className="w-3 h-3 flex gap-0.5">
                  <div className="w-1.5 h-full border border-current rounded-sm" />
                  <div className="w-1.5 h-full flex flex-col gap-0.5">
                    <div className="h-1.5 border border-current rounded-sm" />
                    <div className="h-1.5 border border-current rounded-sm" />
                  </div>
                </div>
              </button>
              <button
                type="button"
                disabled={cards.length < 4}
                className={`p-1 rounded transition ${numWindows === 4 ? "bg-sky-500/20 text-sky-400" : "text-slate-500"}`}
                title="4 Janelas (Grade 2x2)"
              >
                <div className="w-3 h-3 grid grid-cols-2 grid-rows-2 gap-0.5">
                  <div className="border border-current rounded-sm" />
                  <div className="border border-current rounded-sm" />
                  <div className="border border-current rounded-sm" />
                  <div className="border border-current rounded-sm" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Overlay de Snap Layouts ao arrastar card da sidebar */}
        {isDraggingOver && (
          <div className="absolute inset-0 z-40 bg-sky-950/40 border-2 border-dashed border-sky-400 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-100">
            <div className="p-5 rounded-2xl bg-[#141724]/95 border border-sky-400/50 shadow-2xl flex flex-col items-center gap-2 text-center">
              <Columns2 className="h-8 w-8 text-sky-400 animate-pulse" />
              <p className="text-sm font-bold text-white">Solte para dividir a tela</p>
              <p className="text-xs text-sky-300">
                O card será posicionado no layout de gerenciamento ({numWindows + 1 <= 4 ? `${numWindows + 1} janelas` : "Máximo atingido"})
              </p>
            </div>
          </div>
        )}

        {/* Área de Visualização com Grid Responsivo Dinâmico */}
        <div className={`flex-1 overflow-hidden ${getContainerGridClass()}`}>
          {openCards.map((c, index) => (
            <div key={c.id} className={`${getItemSpanClass(index)} flex flex-col`}>
              <CardEditor
                cardId={c.id}
                projectId={projectId}
                cardTitle={c.title}
                category={c.category}
                tagId={c.tagId}
                tags={tags}
                coverImage={c.coverImage}
                icon={c.icon}
                properties={c.properties}
                customFields={c.customFields}
                initialContent={c.contentMarkdown}
                authorName={c.owner.name}
                updatedAt={c.updatedAt}
                allPages={allPages}
                allCards={cards.map((item) => ({ id: item.id, title: item.title, category: item.category }))}
                isSidebarCollapsed={isSidebarCollapsed}
                isWindowed={numWindows > 1}
                onToggleSidebar={handleToggleSidebar}
                onCloseWindow={() => handleCloseWindow(c.id)}
                onMaximizeWindow={() => handleMaximizeWindow(c)}
                onTagsUpdated={(newTags) => setTags(newTags)}
                onCardUpdated={(newTitle, newCat, newTagId) => {
                  setOpenCards((prev) =>
                    prev.map((item) =>
                      item.id === c.id
                        ? { ...item, title: newTitle, category: newCat || item.category, tagId: newTagId || item.tagId }
                        : item
                    )
                  );
                  setCards((prev) =>
                    prev.map((item) =>
                      item.id === c.id
                        ? { ...item, title: newTitle, category: newCat || item.category, tagId: newTagId || item.tagId }
                        : item
                    )
                  );
                }}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
