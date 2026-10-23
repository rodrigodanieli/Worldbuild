"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Link as LinkIcon,
  Copy,
  CopyPlus,
  FolderInput,
  History,
  BarChart2,
  Lock,
  Unlock,
  Trash2,
  Share2,
  Shield,
  Search,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Globe,
} from "lucide-react";

export interface NotionPageMenuProps {
  pageId: string;
  projectId: string;
  pageTitle: string;
  isSecret: boolean;
  isLocked: boolean;
  wordCount: number;
  lastEditedText: string;
  authorName: string;
  contentMarkdown: string;
  allPages: { id: string; title: string }[];
  onToggleLock: () => void;
  onToggleSecret: (newSecret: boolean) => void;
  onPageMoved?: (newParentId: string | null) => void;
  onDeletePage?: () => void;
}

export function NotionPageMenu({
  pageId,
  projectId,
  pageTitle,
  isSecret,
  isLocked,
  wordCount,
  lastEditedText,
  authorName,
  contentMarkdown,
  allPages,
  onToggleLock,
  onToggleSecret,
  onPageMoved,
  onDeletePage,
}: NotionPageMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modais secundários
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);

  // Compartilhamento
  const [shareToken, setShareToken] = useState<string>("");
  const [isPublic, setIsPublic] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha menu ao clicar fora
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

  // 1. Copiar Link da Página
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    showToast("Link copiado para a área de transferência!");
    setIsOpen(false);
  };

  // 2. Copiar Conteúdo da Página em Markdown
  const handleCopyContent = () => {
    navigator.clipboard.writeText(contentMarkdown);
    showToast("Conteúdo Markdown copiado com sucesso!");
    setIsOpen(false);
  };

  // 3. Duplicar Página
  const handleDuplicate = async () => {
    setIsOpen(false);
    showToast("Duplicando página no banco de dados...");
    try {
      const res = await fetch(`/api/pages/${pageId}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao duplicar");
      const data = await res.json();
      showToast("Página duplicada com sucesso!");
      router.push(`/project/${projectId}/wiki/${data.page.id}`);
    } catch (err) {
      showToast("Erro ao duplicar página.");
    }
  };

  // 4. Mover para outro Pai
  const handleMovePage = async (newParentId: string | null) => {
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: newParentId }),
      });
      if (!res.ok) throw new Error("Erro ao mover");
      setIsMoveModalOpen(false);
      showToast("Página movida com sucesso!");
      if (onPageMoved) onPageMoved(newParentId);
      router.refresh();
    } catch (err) {
      alert("Falha ao mover página.");
    }
  };

  // 5. Excluir página
  const handleDelete = async () => {
    setIsOpen(false);
    if (!confirm(`Deseja realmente mover a página "${pageTitle}" para a lixeira?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/pages/${pageId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir");
      showToast("Página removida.");
      if (onDeletePage) onDeletePage();
      else router.push(`/project/${projectId}/wiki`);
    } catch (err) {
      alert("Erro ao excluir página.");
    }
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Botão de 3 Pontos (...) Padrão Notion */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
        title="Configurações e opções da página (Notion)"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-300 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Menu Suspenso Estilo Notion */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#141721] border border-slate-700/80 shadow-2xl p-1.5 z-50 text-xs text-slate-300 select-none animate-in fade-in zoom-in-95 duration-100">
          {/* Caixa de Pesquisa de Ações */}
          <div className="px-2 py-1.5 mb-1 flex items-center gap-1.5 bg-slate-900/90 rounded-lg border border-slate-800">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar ações..."
              className="w-full bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 focus:ring-0"
              autoFocus
            />
          </div>

          <div className="space-y-0.5">
            {/* Copiar Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition group"
            >
              <div className="flex items-center gap-2">
                <LinkIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400" />
                <span>Copiar link</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Ctrl+Alt+L</span>
            </button>

            {/* Copiar Conteúdo */}
            <button
              type="button"
              onClick={handleCopyContent}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition group"
            >
              <div className="flex items-center gap-2">
                <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400" />
                <span>Copiar conteúdo da página</span>
              </div>
            </button>

            {/* Duplicar */}
            <button
              type="button"
              onClick={handleDuplicate}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition group"
            >
              <div className="flex items-center gap-2">
                <CopyPlus className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400" />
                <span>Duplicar</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Ctrl+D</span>
            </button>

            {/* Mover Para */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsMoveModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition group"
            >
              <div className="flex items-center gap-2">
                <FolderInput className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400" />
                <span>Mover para...</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Ctrl+Shift+P</span>
            </button>

            {/* Compartilhamento & Acesso */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsShareModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition group"
            >
              <div className="flex items-center gap-2">
                <Share2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-400" />
                <span>Compartilhar & Permissões</span>
              </div>
              <ChevronRight className="h-3 w-3 text-slate-600" />
            </button>

            {/* Métricas e Estatísticas */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsMetricsModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition group"
            >
              <div className="flex items-center gap-2">
                <BarChart2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-purple-400" />
                <span>Atualizações e métricas</span>
              </div>
            </button>

            <div className="my-1 border-t border-slate-800" />

            {/* Bloquear Página */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 transition">
              <div className="flex items-center gap-2">
                {isLocked ? (
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Unlock className="h-3.5 w-3.5 text-slate-400" />
                )}
                <span>Bloquear página</span>
              </div>
              <input
                type="checkbox"
                checked={isLocked}
                onChange={onToggleLock}
                className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Segredo do Mestre (DM Only) */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 transition">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-rose-400" />
                <span>Segredo do Mestre (DM)</span>
              </div>
              <input
                type="checkbox"
                checked={isSecret}
                onChange={(e) => onToggleSecret(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Mover para a Lixeira */}
            <button
              type="button"
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Mover para a lixeira</span>
            </button>
          </div>

          <div className="my-1 border-t border-slate-800" />

          {/* Rodapé Notion com Última Edição */}
          <div className="px-2.5 py-2 text-[11px] text-slate-500 flex items-center justify-between">
            <div className="truncate">
              <span className="block text-slate-400 font-semibold truncate">{authorName}</span>
              <span>{lastEditedText}</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">{wordCount} palavras</span>
          </div>
        </div>
      )}

      {/* Modal Mover Para (Reparenting) */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#141721] border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsMoveModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <FolderInput className="h-4 w-4 text-amber-400" />
              <span>Mover "{pageTitle}" para:</span>
            </h3>

            <div className="max-h-60 overflow-y-auto space-y-1 mb-4 pr-1">
              <button
                type="button"
                onClick={() => handleMovePage(null)}
                className="w-full text-left px-3 py-2 rounded-xl text-xs bg-slate-900 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-slate-800 transition"
              >
                📁 (Página Raiz do Projeto)
              </button>
              {allPages
                .filter((p) => p.id !== pageId)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleMovePage(p.id)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs bg-slate-900 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-slate-800 transition truncate"
                  >
                    📄 {p.title}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Compartilhamento & Permissões */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#141721] border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Share2 className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Compartilhar Artigo</h3>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Por padrão, este artigo é privado e visível apenas para você. Compartilhe via link direto ou convide jogadores.
            </p>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <Globe className="h-4 w-4 text-amber-400" />
                    <span>Compartilhar na Web</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/share/page-${pageId}`;
                      navigator.clipboard.writeText(shareUrl);
                      showToast("Link público copiado!");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold transition"
                  >
                    Copiar Link
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Qualquer pessoa com este link poderá visualizar a página no modo limpo de leitura.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Métricas da Página */}
      {isMetricsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#141721] border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsMetricsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="h-5 w-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">Métricas do Artigo</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Total de Palavras</span>
                <span className="font-mono font-bold text-white">{wordCount}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Tempo Estimado de Leitura</span>
                <span className="font-mono text-amber-300">
                  {Math.max(1, Math.ceil(wordCount / 200))} min
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Autor</span>
                <span className="text-slate-200">{authorName}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Última Modificação</span>
                <span className="text-slate-300">{lastEditedText}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
