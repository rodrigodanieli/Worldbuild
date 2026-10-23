"use client";

import React, { useState, useEffect } from "react";
import { LayoutDashboard, X, Check, Trash2, Edit3, Plus } from "lucide-react";

interface BoardModalProps {
  isOpen: boolean;
  mode: "create" | "rename" | "delete";
  initialName?: string;
  initialDescription?: string;
  boardCount?: number;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
  onDeleteConfirm?: () => Promise<void>;
}

export function BoardModal({
  isOpen,
  mode,
  initialName = "",
  initialDescription = "",
  boardCount = 1,
  onClose,
  onSubmit,
  onDeleteConfirm,
}: BoardModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || (mode === "create" ? "Novo Board" : ""));
      setDescription(initialDescription || "");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialName, initialDescription, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "delete") {
      if (!onDeleteConfirm) return;
      try {
        setIsSubmitting(true);
        setError(null);
        await onDeleteConfirm();
        onClose();
      } catch (err: any) {
        setError(err?.message || "Erro ao excluir board");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!name.trim()) {
      setError("O nome do board é obrigatório");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar board");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#141724] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#121521]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {mode === "create"
                  ? "Criar Novo Board"
                  : mode === "rename"
                  ? "Renomear Board"
                  : "Excluir Board"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {mode === "create"
                  ? "Organize seus cartões e conexões em um novo quadro temático"
                  : mode === "rename"
                  ? "Atualize o nome e descrição do quadro ativo"
                  : "Tem certeza que deseja excluir este quadro?"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conteúdo */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {mode === "delete" ? (
            <div className="text-xs text-slate-300 space-y-2">
              <p>
                Você está prestes a excluir o quadro <strong className="text-white">"{initialName}"</strong>.
              </p>
              <p className="text-slate-400 text-[11px]">
                Esta ação apagará a disposição visual dos nós deste quadro. Os cartões e páginas originais permanecerão intactos na campanha.
              </p>
              {boardCount <= 1 && (
                <p className="text-amber-400 text-[11px] font-semibold">
                  ⚠️ Este é o único board deste projeto e não pode ser excluído.
                </p>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome do Board <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Relações Políticas, Foco da Campanha, Linha Arcana..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Finalidade deste quadro ou anotações rápidas..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none"
                />
              </div>
            </>
          )}

          {/* Rodapé com Ações */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              Cancelar
            </button>

            {mode === "delete" ? (
              <button
                type="submit"
                disabled={isSubmitting || boardCount <= 1}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/40 transition disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Excluindo..." : "Excluir Board"}</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950/40 transition disabled:opacity-50"
              >
                {mode === "create" ? <Plus className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                <span>{isSubmitting ? "Salvando..." : mode === "create" ? "Criar Board" : "Salvar Alterações"}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
