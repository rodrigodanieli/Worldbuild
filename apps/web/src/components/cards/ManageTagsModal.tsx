"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Edit2, Trash2, Check, Tag, Palette, Loader2 } from "lucide-react";

import { CardTagTemplateItem } from "./card-context-types";

export interface CardTagItem {
  id: string;
  name: string;
  color: string;
  templateFields?: string | any[];
  defaultBanner?: string | null;
  defaultAvatar?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  templates?: CardTagTemplateItem[];
}

export interface ManageTagsModalProps {
  projectId: string;
  tags: CardTagItem[];
  isOpen: boolean;
  onClose: () => void;
  onTagsUpdated: (updatedTags: CardTagItem[]) => void;
}

const PRESET_COLORS = [
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#10b981", // Emerald
  "#38bdf8", // Sky
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#84cc16", // Lime
  "#6366f1", // Indigo
  "#e11d48", // Crimson
  "#94a3b8", // Slate
];

export function ManageTagsModal({
  projectId,
  tags,
  isOpen,
  onClose,
  onTagsUpdated,
}: ManageTagsModalProps) {
  const [tagList, setTagList] = useState<CardTagItem[]>(tags);

  useEffect(() => {
    setTagList(tags);
  }, [tags]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#38bdf8");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) {
      setErrorMessage("Digite o nome da tag.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/cards/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worldId: projectId,
          name: newTagName.trim(),
          color: newTagColor,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar tag");
      }

      const { tag } = await res.json();
      const updated = [...tagList.filter((t) => t.id !== tag.id), tag];
      setTagList(updated);
      onTagsUpdated(updated);
      setNewTagName("");
    } catch (err: any) {
      setErrorMessage(err.message || "Falha ao criar tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (t: CardTagItem) => {
    setEditingTagId(t.id);
    setEditName(t.name);
    setEditColor(t.color);
  };

  const handleSaveEdit = async (tagId: string) => {
    if (!editName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/cards/tags/${tagId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          color: editColor,
        }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar tag");
      const { tag } = await res.json();
      const updated = tagList.map((t) => (t.id === tagId ? tag : t));
      setTagList(updated);
      onTagsUpdated(updated);
      setEditingTagId(null);
    } catch (err: any) {
      alert("Falha ao salvar alterações da tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTag = async (tagId: string, name: string) => {
    if (!confirm(`Deseja realmente remover a tag "${name}" deste projeto?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/cards/tags/${tagId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erro ao excluir");

      const updated = tagList.filter((t) => t.id !== tagId);
      setTagList(updated);
      onTagsUpdated(updated);
    } catch (err) {
      alert("Falha ao excluir tag");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#141721] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gerenciar Tags do Projeto</h3>
              <p className="text-xs text-slate-400">Personalize categorias, nomes e cores dos cards</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Formulário de Nova Tag */}
        <form onSubmit={handleCreateTag} className="my-4 p-3 bg-[#181c28] border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-sky-400" />
              <span>Adicionar Nova Tag</span>
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nome da tag (ex: Facção Secreta, Relíquia, Chefe...)"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="flex-1 bg-[#12151e] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition disabled:opacity-50 shrink-0"
            >
              Criar
            </button>
          </div>

          {/* Seletor de cores da nova tag */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-slate-400 mr-1">Cor:</span>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewTagColor(c)}
                className={`h-5 w-5 rounded-full transition-transform flex items-center justify-center ${
                  newTagColor === c ? "scale-125 ring-2 ring-white" : "hover:scale-110"
                }`}
                style={{ backgroundColor: c }}
              >
                {newTagColor === c && <Check className="h-3 w-3 text-black stroke-[3]" />}
              </button>
            ))}
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="h-5 w-6 rounded cursor-pointer bg-transparent border-0 ml-1"
              title="Cor customizada"
            />
          </div>
        </form>

        {/* Lista de Tags Existentes */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Tags Ativas ({tagList.length})
          </div>

          {tagList.map((t) => {
            const isEditing = editingTagId === t.id;

            if (isEditing) {
              return (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-[#1a1e2b] border border-sky-500/40 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 bg-[#12151e] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(t.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTagId(null)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className={`h-4 w-4 rounded-full transition-transform ${
                          editColor === c ? "scale-125 ring-2 ring-white" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="h-4 w-5 rounded cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>
              );
            }

            return (
              <div
                key={t.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#161922] border border-slate-800 hover:border-slate-700 text-xs transition"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="font-medium text-slate-200 truncate">{t.name}</span>
                  {t.templateFields && t.templateFields !== "[]" && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Template Salvo
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(t)}
                    className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition"
                    title="Editar Tag"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(t.id, t.name)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Excluir Tag"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
