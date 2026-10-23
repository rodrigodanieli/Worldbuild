"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  ChevronDown,
  ChevronRight,
  Shield,
  Trash2,
  FolderPlus,
  X,
  Loader2,
  Layers,
  PanelLeftClose,
} from "lucide-react";

export interface WikiPageItem {
  id: string;
  title: string;
  parentId: string | null;
  isSecret: boolean;
}

export interface WikiTreeSidebarProps {
  projectId: string;
  pages: WikiPageItem[];
  currentPageId: string;
  isOwner: boolean;
  onCollapseSidebar?: () => void;
}

interface TreeNode extends WikiPageItem {
  children: TreeNode[];
}

export function WikiTreeSidebar({
  projectId,
  pages: initialPages,
  currentPageId,
  isOwner,
  onCollapseSidebar,
}: WikiTreeSidebarProps) {
  const router = useRouter();
  const [pages, setPages] = useState<WikiPageItem[]>(initialPages);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Estado para Modal de Criação de Página / Subpágina
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [isSecret, setIsSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Constrói árvore hierárquica recursiva
  const tree = useMemo(() => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Inicializa nós
    pages.forEach((p) => {
      map.set(p.id, { ...p, children: [] });
    });

    // Vincula filhos aos pais
    pages.forEach((p) => {
      const node = map.get(p.id)!;
      if (p.parentId && map.has(p.parentId)) {
        map.get(p.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [pages]);

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCollapsedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenCreateModal = (parentId: string | null = null, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedParentId(parentId);
    setNewTitle("");
    setIsSecret(false);
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMessage("Por favor, digite o título da página.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worldId: projectId,
          title: newTitle.trim(),
          parentId: selectedParentId || null,
          isSecret,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao criar página");
      }

      const data = await res.json();
      const newPage = data.page;

      // Atualiza lista local
      setPages((prev) => [...prev, newPage]);
      setIsModalOpen(false);

      // Redireciona imediatamente para a nova página criada
      router.push(`/project/${projectId}/wiki/${newPage.id}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Erro de conexão ao criar página.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePage = async (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Tem certeza que deseja excluir a página "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/pages/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Falha ao excluir página");
      }

      const updated = pages.filter((p) => p.id !== id);
      setPages(updated);

      if (id === currentPageId) {
        if (updated.length > 0) {
          router.push(`/project/${projectId}/wiki/${updated[0].id}`);
        } else {
          router.push(`/project/${projectId}/wiki`);
        }
      }
    } catch (err) {
      alert("Erro ao excluir página.");
    }
  };

  // Renderizador recursivo de cada nível da árvore
  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isSelected = node.id === currentPageId;
    const hasChildren = node.children.length > 0;
    const isCollapsed = !!collapsedNodes[node.id];

    return (
      <div key={node.id} className="flex flex-col">
        <div
          className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition cursor-pointer select-none ${
            isSelected
              ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
          style={{ paddingLeft: `${Math.max(8, depth * 16 + 8)}px` }}
        >
          {/* Lado Esquerdo: Ícone + Título */}
          <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleCollapse(node.id, e)}
                className="p-0.5 rounded hover:bg-slate-700/60 text-slate-400"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            ) : (
              <span className="w-3 inline-block" />
            )}

            <Link
              href={`/project/${projectId}/wiki/${node.id}`}
              className="flex items-center gap-1.5 truncate flex-1 min-w-0"
            >
              <FileText className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-amber-400" : "text-slate-500"}`} />
              <span className="truncate">{node.title}</span>
            </Link>
          </div>

          {/* Lado Direito: Badges e Ações rápidas no Hover */}
          <div className="flex items-center gap-1 shrink-0">
            {node.isSecret && (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-900 shrink-0">
                DM
              </span>
            )}

            {isOwner && (
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
                {/* Botão de adicionar subpágina dentro deste nó */}
                <button
                  type="button"
                  title="Criar Subpágina"
                  onClick={(e) => handleOpenCreateModal(node.id, e)}
                  className="p-1 rounded hover:bg-amber-500/20 hover:text-amber-300 text-slate-500 transition"
                >
                  <Plus className="h-3 w-3" />
                </button>

                {/* Botão de exclusão */}
                <button
                  type="button"
                  title="Excluir Página"
                  onClick={(e) => handleDeletePage(node.id, node.title, e)}
                  className="p-1 rounded hover:bg-rose-500/20 hover:text-rose-400 text-slate-500 transition"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filhos indentados */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col border-l border-slate-800/60 ml-4">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const parentPageName = selectedParentId
    ? pages.find((p) => p.id === selectedParentId)?.title
    : null;

  return (
    <aside className="w-72 border-r border-slate-800/80 bg-[#12151e]/90 flex flex-col justify-between select-none shrink-0">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Cabeçalho da Sidebar com Botão Criar Página */}
        <div className="p-3 border-b border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              Artigos da Wiki
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {pages.length} {pages.length === 1 ? "pág" : "págs"}
              </span>
              {onCollapseSidebar && (
                <button
                  type="button"
                  onClick={onCollapseSidebar}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Recolher menu lateral (Visualização Completa)"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={() => handleOpenCreateModal(null)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova Página Raiz</span>
            </button>
          )}
        </div>

        {/* Árvore Hierárquica */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
          {tree.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Nenhuma página criada ainda. Clique em "Nova Página" acima para começar.
            </div>
          ) : (
            tree.map((rootNode) => renderNode(rootNode, 0))
          )}
        </div>

        {/* Rodapé da Sidebar com Identificador do Banco SQLite */}
        <div className="p-3 border-t border-slate-800/80 bg-[#10131b] flex items-center justify-between text-xs text-slate-500 font-mono">
          <span className="truncate">Ativa: {currentPageId.substring(0, 10)}...</span>
          <span className="text-amber-400">SQLite</span>
        </div>
      </div>

      {/* Modal Interativo de Criação de Página / Subpágina */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#141721] border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <FolderPlus className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                {selectedParentId
                  ? `Criar Subpágina em "${parentPageName}"`
                  : "Criar Nova Página Raiz"}
              </h3>
            </div>

            {errorMessage && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreatePage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título do Artigo / Página
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Forjas de Ferro-Escuro, Taverna do Javali..."
                  autoFocus
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Seletor de Página Pai (Hierarquia de Pastas) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hierarquia / Pasta Pai
                </label>
                <select
                  value={selectedParentId || ""}
                  onChange={(e) => setSelectedParentId(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="">(Nenhuma - Página Raiz do Projeto)</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      📁 {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle de Segredo do Mestre */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modal-secret-toggle"
                  checked={isSecret}
                  onChange={(e) => setIsSecret(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                />
                <label
                  htmlFor="modal-secret-toggle"
                  className="text-xs text-slate-300 flex items-center gap-1 cursor-pointer select-none"
                >
                  <Shield className="h-3.5 w-3.5 text-rose-400" />
                  <span>Segredo de Mestre (visível apenas para você)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold transition disabled:opacity-50 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Criando no SQLite...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Criar Página</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
