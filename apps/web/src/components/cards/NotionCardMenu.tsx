"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Link as LinkIcon,
  Copy,
  CopyPlus,
  BarChart2,
  Lock,
  Unlock,
  Trash2,
  Check,
  X,
  CreditCard,
  Sliders,
  BookmarkCheck,
  RotateCcw,
  Image as ImageIcon,
  User,
  Plus,
} from "lucide-react";

export interface NotionCardMenuProps {
  cardId: string;
  projectId: string;
  cardTitle: string;
  isSecret: boolean;
  isLocked: boolean;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
  onOpenSaveTemplate?: () => void;
  onOpenApplyTemplate?: () => void;
  onOpenBannerModal?: () => void;
  onOpenAvatarModal?: () => void;
  wordCount: number;
  lastEditedText: string;
  authorName: string;
  contentMarkdown: string;
  onToggleLock: () => void;
  onToggleSecret: (newSecret: boolean) => void;
  onDeleteCard?: () => void;
}

export function NotionCardMenu({
  cardId,
  projectId,
  cardTitle,
  isSecret,
  isLocked,
  isEditMode = false,
  onToggleEditMode,
  onOpenSaveTemplate,
  onOpenApplyTemplate,
  onOpenBannerModal,
  onOpenAvatarModal,
  wordCount,
  lastEditedText,
  authorName,
  contentMarkdown,
  onToggleLock,
  onToggleSecret,
  onDeleteCard,
}: NotionCardMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    showToast("Link do card copiado!");
    setIsOpen(false);
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(contentMarkdown);
    showToast("Markdown copiado!");
    setIsOpen(false);
  };

  const handleDuplicate = async () => {
    setIsOpen(false);
    showToast("Duplicando card...");
    try {
      const res = await fetch(`/api/cards/${cardId}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao duplicar");
      const data = await res.json();
      showToast("Card duplicado com sucesso!");
      router.push(`/project/${projectId}/cards/${data.card.id}`);
    } catch (err) {
      showToast("Erro ao duplicar card.");
    }
  };

  const handleDelete = async () => {
    setIsOpen(false);
    if (!confirm(`Deseja realmente excluir o card "${cardTitle}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir");
      showToast("Card removido.");
      if (onDeleteCard) onDeleteCard();
      else router.push(`/project/${projectId}/cards`);
    } catch (err) {
      alert("Erro ao excluir card.");
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161a24] border border-sky-500/40 text-slate-100 text-xs px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="h-4 w-4 text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Botão de 3 Pontos (...) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition shadow-sm"
        title="Configurações e Opções do Card"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {/* Dropdown do Menu (...) */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-[#141721] border border-slate-700/80 shadow-2xl p-1.5 text-xs text-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100 select-none">
          <div className="px-2.5 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-sky-400" />
              <span>Configurações do Card</span>
            </span>
          </div>

          <div className="p-1 space-y-0.5">
            {/* 1. MODO DE EDIÇÃO DE CAMPOS (TOGGLE) */}
            {onToggleEditMode && (
              <button
                type="button"
                onClick={() => {
                  onToggleEditMode();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition font-medium ${
                  isEditMode
                    ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                    : "hover:bg-slate-800 text-slate-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sliders className={`h-3.5 w-3.5 ${isEditMode ? "text-amber-400" : "text-slate-400"}`} />
                  <span>Modo de Edição de Campos</span>
                </span>
                {isEditMode && <Check className="h-3.5 w-3.5 text-amber-400" />}
              </button>
            )}

            {/* 2. TEMPLATES */}
            {onOpenSaveTemplate && (
              <button
                type="button"
                onClick={() => {
                  onOpenSaveTemplate();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-800 hover:text-white transition group"
              >
                <BookmarkCheck className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400" />
                <span>Salvar como Template</span>
              </button>
            )}

            {onOpenApplyTemplate && (
              <button
                type="button"
                onClick={() => {
                  onOpenApplyTemplate();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-800 hover:text-white transition group"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-400" />
                <span>Aplicar Template da Tag</span>
              </button>
            )}

            <div className="my-1 border-t border-slate-800" />

            {/* 3. GESTÃO DE APARÊNCIA (BANNER E AVATAR) */}
            {onOpenBannerModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenBannerModal();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-800 hover:text-white transition group"
              >
                <ImageIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400" />
                <span>Alterar / Adicionar Capa (Banner)</span>
              </button>
            )}

            {onOpenAvatarModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenAvatarModal();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-800 hover:text-white transition group"
              >
                <User className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-400" />
                <span>Alterar / Adicionar Avatar</span>
              </button>
            )}

            <div className="my-1 border-t border-slate-800" />

            {/* 4. AÇÕES PADRÃO DO CARD */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-800 hover:text-white transition group"
            >
              <LinkIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-400" />
              <span>Copiar link</span>
            </button>

            <button
              type="button"
              onClick={handleCopyContent}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-800 hover:text-white transition group"
            >
              <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-400" />
              <span>Copiar markdown</span>
            </button>

            <button
              type="button"
              onClick={handleDuplicate}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-800 hover:text-white transition group"
            >
              <CopyPlus className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-400" />
              <span>Duplicar card</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onToggleLock();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-800 hover:text-white transition group"
            >
              <span className="flex items-center gap-2">
                {isLocked ? (
                  <Unlock className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400" />
                )}
                <span>{isLocked ? "Desbloquear edição" : "Bloquear edição"}</span>
              </span>
              {isLocked && <Check className="h-3 w-3 text-amber-400" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsMetricsModalOpen(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-800 hover:text-white transition group"
            >
              <BarChart2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-400" />
              <span>Informações do card</span>
            </button>

            <div className="my-1 border-t border-slate-800" />

            {/* 5. Excluir */}
            <button
              type="button"
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Excluir card</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Estatísticas / Informações */}
      {isMetricsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#141721] border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-5 relative">
            <button
              type="button"
              onClick={() => setIsMetricsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-sky-400" />
              <span>Informações do Card</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Total de Palavras</span>
                <span className="font-semibold text-slate-200">{wordCount}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Caracteres</span>
                <span className="font-semibold text-slate-200">{contentMarkdown.length}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Autor</span>
                <span className="font-semibold text-slate-200">{authorName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Última Edição</span>
                <span className="font-semibold text-slate-200">{lastEditedText}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsMetricsModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
