"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Plus,
  Trash2,
  Copy,
  X,
  Loader2,
  PanelLeftClose,
  Search,
  Tag,
  LayoutGrid,
  Columns2,
  Sparkles,
} from "lucide-react";
import { ManageTagsModal, CardTagItem } from "./ManageTagsModal";

export interface CardItem {
  id: string;
  title: string;
  category: string;
  tagId?: string | null;
  tag?: CardTagItem | null;
  isSecret?: boolean;
}

export interface CardsSidebarProps {
  projectId: string;
  cards: CardItem[];
  openCardIds: string[];
  tags: CardTagItem[];
  isOwner: boolean;
  onOpenCardFull: (card: CardItem) => void;
  onAddCardSplit: (card: CardItem) => void;
  onTagsUpdated: (tags: CardTagItem[]) => void;
  onCollapseSidebar?: () => void;
}

export function CardsSidebar({
  projectId,
  cards: initialCards,
  openCardIds,
  tags,
  isOwner,
  onOpenCardFull,
  onAddCardSplit,
  onTagsUpdated,
  onCollapseSidebar,
}: CardsSidebarProps) {
  const router = useRouter();
  const [cards, setCards] = useState<CardItem[]>(initialCards);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("Todos");

  // Modal de Criação de Card
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTagId, setNewTagId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Modal de Gerenciamento de Tags
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);

  // Mantém sincronizado quando initialCards mudar
  React.useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);

  // Filtragem plana por busca e tag selecionada
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesSearch =
        !searchTerm.trim() ||
        card.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (card.category && card.category.toLowerCase().includes(searchTerm.toLowerCase().trim()));

      const matchesTag =
        selectedTag === "Todos" ||
        card.category?.toLowerCase() === selectedTag.toLowerCase() ||
        card.tagId === selectedTag;

      return matchesSearch && matchesTag;
    });
  }, [cards, searchTerm, selectedTag]);

  const handleOpenCreateModal = () => {
    setNewTitle("");
    setNewTagId("");
    setSelectedTemplateId("");
    setErrorMessage("");
    setIsCreateModalOpen(true);
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMessage("Por favor, digite um título para o card.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const selectedTagObj = tags.find((t) => t.id === newTagId);
      const availableTemplates = selectedTagObj?.templates || [];
      const selectedTemplate = availableTemplates.find((t) => t.id === selectedTemplateId);

      let initialFields: any[] = [];
      let initialBanner: string | null = null;
      let initialAvatar: string | null = null;

      if (selectedTemplate) {
        initialFields =
          typeof selectedTemplate.fields === "string"
            ? JSON.parse(selectedTemplate.fields)
            : selectedTemplate.fields;
        initialBanner = selectedTemplate.defaultBanner || null;
        initialAvatar = selectedTemplate.defaultAvatar || null;
      }

      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worldId: projectId,
          title: newTitle.trim(),
          category: selectedTagObj?.name || "Card",
          tagId: selectedTagObj?.id || null,
          customFields: initialFields,
          coverImage: initialBanner,
          icon: initialAvatar,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha ao criar card no banco");
      }

      const { card: createdCard } = await response.json();

      setCards((prev) => [createdCard, ...prev]);
      setIsCreateModalOpen(false);

      // Abre imediatamente o novo card
      onOpenCardFull(createdCard);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao criar card.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicateCard = async (cardId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await fetch(`/api/cards/${cardId}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erro ao duplicar");
      const { card: newCard } = await res.json();
      setCards((prev) => [newCard, ...prev]);
      onOpenCardFull(newCard);
    } catch (err) {
      alert("Falha ao duplicar o card.");
    }
  };

  const handleDeleteCard = async (cardId: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Tem certeza que deseja excluir o card "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Falha ao excluir card");
      }

      const updated = cards.filter((c) => c.id !== cardId);
      setCards(updated);

      if (openCardIds.includes(cardId)) {
        if (updated.length > 0) {
          onOpenCardFull(updated[0]);
        }
      }
    } catch (err) {
      alert("Erro ao excluir card.");
    }
  };

  return (
    <aside className="w-72 h-full flex flex-col bg-[#11131a] border-r border-slate-800 select-none">
      {/* 1. Topo da Sidebar: Título, Contador e Botão de Recolher */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="truncate">
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider truncate">
              Cards da Campanha
            </h2>
            <p className="text-[10px] text-slate-500">{cards.length} cards registrados</p>
          </div>
        </div>

        {onCollapseSidebar && (
          <button
            type="button"
            onClick={onCollapseSidebar}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Recolher menu lateral"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 2. Campo de Busca, Botão Novo Card e Botão Gerenciar Tags */}
      <div className="p-2 space-y-2 border-b border-slate-800/80">
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar cards..."
            className="w-full bg-[#161922] border border-slate-800/80 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isOwner && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-semibold shadow-sm transition group"
            >
              <Plus className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              <span>Novo Card</span>
            </button>
          )}

          {/* Botão de Gerenciamento de Tags */}
          <button
            type="button"
            onClick={() => setIsTagsModalOpen(true)}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 text-xs font-medium transition"
            title="Gerenciar tags e categorias do projeto"
          >
            <Tag className="h-3.5 w-3.5 text-amber-400" />
            <span>Tags</span>
          </button>
        </div>
      </div>

      {/* 3. Filtro rápido de tags com cores dinâmicas */}
      <div className="px-2 py-1.5 flex gap-1 overflow-x-auto scrollbar-none border-b border-slate-800/60 text-[10px]">
        <button
          type="button"
          onClick={() => setSelectedTag("Todos")}
          className={`px-2 py-0.5 rounded-full whitespace-nowrap transition ${
            selectedTag === "Todos"
              ? "bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30"
              : "bg-slate-800/40 text-slate-400 hover:text-slate-200"
          }`}
        >
          Todos
        </button>

        {tags.map((t) => {
          const isSelected = selectedTag === t.id || selectedTag === t.name;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTag(t.name)}
              className={`px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1 transition ${
                isSelected
                  ? "font-semibold border shadow-sm"
                  : "bg-slate-800/40 text-slate-400 hover:text-slate-200"
              }`}
              style={{
                backgroundColor: isSelected ? `${t.color}22` : undefined,
                borderColor: isSelected ? `${t.color}66` : undefined,
                color: isSelected ? t.color : undefined,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
              <span>{t.name.split("/")[0].trim()}</span>
            </button>
          );
        })}
      </div>

      {/* Dica de arrastar para divisão de tela */}
      <div className="px-2.5 py-1 bg-[#141824] border-b border-slate-800/60 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1 text-slate-400">
          <Columns2 className="h-3 w-3 text-sky-400" />
          <span>Arraste para dividir tela</span>
        </span>
        <span className="text-[9px] font-mono text-sky-400/80">até 4 janelas</span>
      </div>

      {/* 4. Lista Plana de N Cards Arrastáveis */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {filteredCards.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-xs text-slate-500">
              {searchTerm ? "Nenhum card encontrado para esta busca." : "Nenhum card cadastrado ainda."}
            </p>
            {isOwner && !searchTerm && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-3 text-xs text-sky-400 hover:underline"
              >
                Criar o primeiro card
              </button>
            )}
          </div>
        ) : (
          filteredCards.map((card) => {
            const isOpen = openCardIds.includes(card.id);
            const tagObj = tags.find((t) => t.id === card.tagId || t.name === card.category);
            const tagColor = tagObj?.color || "#38bdf8";

            return (
              <div
                key={card.id}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/worldbuild-card", card.id);
                  e.dataTransfer.setData("cardId", card.id);
                  e.dataTransfer.setData("cardTitle", card.title);
                  e.dataTransfer.setData("text/plain", card.id);
                }}
                onClick={() => onOpenCardFull(card)}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-grab active:cursor-grabbing select-none ${
                  isOpen
                    ? "bg-sky-500/20 text-sky-100 font-bold border border-sky-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }`}
                title="Clique para abrir em tela cheia ou arraste para dividir a tela"
              >
                {/* Lado Esquerdo: Indicador de Cor + Título + Categoria */}
                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: tagColor }}
                  />
                  <div className="truncate flex-1 min-w-0">
                    <span className="truncate block leading-tight">{card.title}</span>
                    <span className="text-[10px] text-slate-500 font-normal truncate block">
                      {card.category || "Geral"}
                    </span>
                  </div>
                </div>

                {/* Lado Direito: Ação de divisão e menu */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Botão de Adicionar à Divisão de Tela */}
                  <button
                    type="button"
                    title="Dividir tela com este card (até 4)"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddCardSplit(card);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-sky-500/20 hover:text-sky-300 text-slate-400 transition"
                  >
                    <Columns2 className="h-3 w-3" />
                  </button>

                  {isOwner && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
                      <button
                        type="button"
                        title="Duplicar Card"
                        onClick={(e) => handleDuplicateCard(card.id, e)}
                        className="p-1 rounded hover:bg-sky-500/20 hover:text-sky-300 text-slate-500 transition"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        title="Excluir Card"
                        onClick={(e) => handleDeleteCard(card.id, card.title, e)}
                        className="p-1 rounded hover:bg-rose-500/20 hover:text-rose-400 text-slate-500 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Criação de Card */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#141721] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Criar Novo Card</h3>
                <p className="text-xs text-slate-400">Adicione um novo registro à campanha</p>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Título do Card *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gandalf, Espada Vorpal, Taverna do Javali..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#1b1f2b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Tag do Projeto (Opcional)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Não obrigatória</span>
                </label>
                <select
                  value={newTagId}
                  onChange={(e) => {
                    setNewTagId(e.target.value);
                    setSelectedTemplateId("");
                  }}
                  className="w-full bg-[#1b1f2b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="">(Sem Tag / Nenhuma)</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seletor Dinâmico de Template de acordo com a Tag Selecionada */}
              {newTagId && (() => {
                const tagObj = tags.find((t) => t.id === newTagId);
                const templatesList = tagObj?.templates || [];
                if (templatesList.length === 0) return null;

                return (
                  <div className="animate-in fade-in duration-150">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Template da Tag ({tagObj?.name})</span>
                      <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        <span>{templatesList.length} modelo(s)</span>
                      </span>
                    </label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full bg-[#1b1f2b] border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-amber-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="">(Em branco / Sem template)</option>
                      {templatesList.map((tmpl) => {
                        const count =
                          typeof tmpl.fields === "string"
                            ? JSON.parse(tmpl.fields).length
                            : Array.isArray(tmpl.fields)
                            ? tmpl.fields.length
                            : 0;
                        return (
                          <option key={tmpl.id} value={tmpl.id}>
                            ⭐ {tmpl.name} ({count} campos)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Criar Card</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Gerenciamento de Tags */}
      <ManageTagsModal
        projectId={projectId}
        tags={tags}
        isOpen={isTagsModalOpen}
        onClose={() => setIsTagsModalOpen(false)}
        onTagsUpdated={onTagsUpdated}
      />
    </aside>
  );
}
