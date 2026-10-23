"use client";

import React, { useState, useEffect } from "react";
import { X, BookmarkCheck, Loader2, Sparkles, Layers, Image as ImageIcon, User } from "lucide-react";
import { CardCustomField, CardTagTemplateItem } from "./card-context-types";
import { CardTagItem } from "./ManageTagsModal";

interface SaveTemplateModalProps {
  isOpen: boolean;
  tags: CardTagItem[];
  currentTagId?: string | null;
  fields: CardCustomField[];
  banner?: string | null;
  avatar?: string | null;
  onClose: () => void;
  onSaved: (newTemplate: CardTagTemplateItem, tagId: string) => void;
}

export function SaveTemplateModal({
  isOpen,
  tags,
  currentTagId,
  fields,
  banner,
  avatar,
  onClose,
  onSaved,
}: SaveTemplateModalProps) {
  const [templateName, setTemplateName] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string>(currentTagId || tags[0]?.id || "");
  const [includeBanner, setIncludeBanner] = useState(true);
  const [includeAvatar, setIncludeAvatar] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTemplateName("");
      setSelectedTagId(currentTagId || tags[0]?.id || "");
      setIncludeBanner(true);
      setIncludeAvatar(true);
      setErrorMessage("");
    }
  }, [isOpen, currentTagId, tags]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      setErrorMessage("Por favor, informe um nome para o template.");
      return;
    }

    if (!selectedTagId) {
      setErrorMessage("Selecione uma tag para associar a este template.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/cards/tags/${selectedTagId}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          fields,
          defaultBanner: includeBanner ? banner || null : null,
          defaultAvatar: includeAvatar ? avatar || null : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao salvar template.");
      }

      const { template } = await res.json();
      onSaved(template, selectedTagId);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Erro ao salvar template.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTag = tags.find((t) => t.id === selectedTagId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/80 bg-[#141724] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">Salvar como Modelo / Template</h3>
              <p className="text-[11px] text-slate-400">
                Guarde a estrutura de campos e visual para reutilizar nesta tag.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Template */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome do Template *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Metrópole Comercial, Vilarejo Rural, NPC Nobre..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              autoFocus
            />
          </div>

          {/* Seleção da Tag de Destino */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Vincular à Tag
            </label>
            <select
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Preview dos Dados que Serão Salvos */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Resumo do Template:
            </span>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-amber-400" />
                <span>Campos estruturados:</span>
              </span>
              <span className="font-bold text-white">{fields.length} campos</span>
            </div>

            {banner && (
              <label className="flex items-center justify-between text-slate-300 cursor-pointer pt-1 border-t border-slate-800/80">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-sky-400" />
                  <span>Salvar Capa atual no template</span>
                </span>
                <input
                  type="checkbox"
                  checked={includeBanner}
                  onChange={(e) => setIncludeBanner(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900 cursor-pointer"
                />
              </label>
            )}

            {avatar && (
              <label className="flex items-center justify-between text-slate-300 cursor-pointer pt-1 border-t border-slate-800/80">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Salvar Avatar atual no template</span>
                </span>
                <input
                  type="checkbox"
                  checked={includeAvatar}
                  onChange={(e) => setIncludeAvatar(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900 cursor-pointer"
                />
              </label>
            )}
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-400 font-medium bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/50">
              {errorMessage}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs transition shadow-lg disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Salvar Template</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
