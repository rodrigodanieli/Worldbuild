"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  MoreVertical, 
  Edit3, 
  Image as ImageIcon, 
  Trash2, 
  BookOpen, 
  Map as MapIcon, 
  Lock, 
  Sparkles,
  X,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { ProjectHeader } from "../layout/ProjectHeader";

export interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  ownerId: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    pages: number;
    maps: number;
  };
}

export interface ProjectsDashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    settings?: Record<string, any>;
  };
  initialProjects: ProjectItem[];
}

const COVER_PRESETS = [
  {
    name: "Castelo & Névoa",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Mar & Ilhas",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Montanhas Épicas",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Floresta Mística",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
  },
];

export function ProjectsDashboard({ user, initialProjects }: ProjectsDashboardProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Estados dos Modais
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCover, setNewCover] = useState(COVER_PRESETS[0].url);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para Edição de Projeto Existente
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCover, setEditCover] = useState("");

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          coverImage: newCover,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar projeto");

      setProjects((prev) => [data.project, ...prev]);
      setIsCreateOpen(false);
      setNewName("");
      setNewDesc("");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          coverImage: editCover,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar");

      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? { ...p, ...data.project } : p))
      );
      setEditingProject(null);
      setActiveMenuId(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Tem certeza que deseja excluir este projeto? Todos os artigos e mapas dele serão apagados.")) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir");
      }

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setActiveMenuId(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#090b10] flex flex-col select-none">
      {/* 1. Header Global Padrão */}
      <ProjectHeader user={user} />

      {/* 2. Conteúdo Principal da Lista de Projetos */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Meus Projetos & Mundos de RPG
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Selecione um projeto para gerenciar a wiki, mapas 14K, mapa mental, cronograma e quadros.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 px-3 py-1.5 rounded-lg bg-[#141721] border border-slate-800">
            {projects.length} {projects.length === 1 ? "projeto ativo" : "projetos ativos"}
          </span>
        </div>

        {/* 3. Grid de 3 Colunas por N Linhas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* PRIMEIRA CASA DA GRID: SEMPRE O BOTÃO DE NOVO PROJETO (+) */}
          <div
            onClick={() => setIsCreateOpen(true)}
            className="group relative h-64 rounded-2xl border-2 border-dashed border-slate-800 hover:border-amber-500/60 bg-[#12151e]/50 hover:bg-[#161a26] transition flex flex-col items-center justify-center cursor-pointer p-6 shadow-lg"
          >
            <div className="h-14 w-14 rounded-full bg-slate-800/80 group-hover:bg-amber-500 group-hover:scale-110 flex items-center justify-center transition shadow-md">
              <Plus className="h-7 w-7 text-slate-400 group-hover:text-black transition" />
            </div>
            <h3 className="font-bold text-base text-slate-200 group-hover:text-amber-400 transition mt-4">
              Criar Novo Projeto
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Inicie um novo mundo com wiki, mapas e linha do tempo
            </p>
          </div>

          {/* DEMAIS CASAS DA GRID: CADA CASA É UM PROJETO */}
          {projects.map((project) => {
            const isOwner = project.ownerId === user.id;
            const menuOpen = activeMenuId === project.id;
            const bgImage = project.coverImage || COVER_PRESETS[0].url;

            return (
              <div
                key={project.id}
                className="group relative h-64 rounded-2xl border border-slate-800/90 overflow-hidden shadow-xl hover:shadow-2xl hover:border-amber-500/50 transition flex flex-col justify-between"
                style={{
                  backgroundImage: `url('${bgImage}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Overlay Escurecido para Contraste */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f14] via-[#0d0f14]/50 to-black/40 group-hover:via-[#0d0f14]/40 transition" />

                {/* Topo do Card: Badge de Posse e Botão de Três Pontos (...) */}
                <div className="relative z-10 p-4 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded backdrop-blur-md border ${
                      isOwner
                        ? "bg-amber-950/60 text-amber-300 border-amber-800/70"
                        : "bg-sky-950/60 text-sky-300 border-sky-800/70"
                    }`}
                  >
                    {isOwner ? "Mestre / Criador" : "Convidado"}
                  </span>

                  {/* Botão de Três Pontos (...) */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(menuOpen ? null : project.id);
                      }}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition shadow-md"
                      title="Configurações do Projeto"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {/* Menu Suspenso de Configurações do Projeto */}
                    {menuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-700 bg-[#141721] p-1.5 shadow-2xl backdrop-blur-xl z-30 animate-in zoom-in-95 duration-150"
                      >
                        <button
                          onClick={() => {
                            setEditingProject(project);
                            setEditName(project.name);
                            setEditCover(project.coverImage || "");
                          }}
                          className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-amber-400" />
                          <span>Editar Nome</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditingProject(project);
                            setEditName(project.name);
                            setEditCover(project.coverImage || "");
                          }}
                          className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
                        >
                          <ImageIcon className="h-3.5 w-3.5 text-sky-400" />
                          <span>Plano de Fundo</span>
                        </button>

                        {isOwner && (
                          <>
                            <div className="my-1 border-t border-slate-800" />
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Excluir Projeto</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Parte Inferior do Card: Nome do Projeto e Informações */}
                <Link
                  href={`/project/${project.id}/wiki`}
                  className="relative z-10 p-5 flex flex-col justify-end group/title"
                >
                  <h3 className="text-xl font-extrabold text-white group-hover/title:text-amber-300 transition drop-shadow-md">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-xs text-slate-300 mt-1 line-clamp-1 drop-shadow-sm">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-700/50 text-[11px] text-slate-300 font-medium">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-amber-400" />
                      <span>{project._count?.pages ?? 0} artigos</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapIcon className="h-3 w-3 text-sky-400" />
                      <span>{project._count?.maps ?? 0} mapas</span>
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </main>

      {/* MODAL: CRIAR NOVO PROJETO */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#12151e] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Criar Novo Projeto (Mundo de RPG)
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nome do Projeto / Mundo *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Reino de Faerûn ou Campanha Sol Negro"
                  className="w-full px-3 py-2 rounded-lg bg-[#181c28] border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Descrição Rápida (Opcional)
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ex: Campanha de mistério e exploração náutica"
                  className="w-full px-3 py-2 rounded-lg bg-[#181c28] border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Plano de Fundo (Capa do Projeto)
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {COVER_PRESETS.map((p) => (
                    <div
                      key={p.name}
                      onClick={() => setNewCover(p.url)}
                      style={{ backgroundImage: `url('${p.url}')` }}
                      className={`h-16 rounded-lg bg-cover bg-center border-2 cursor-pointer flex items-end p-1.5 transition ${
                        newCover === p.url ? "border-amber-400 shadow-md scale-102" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.2 rounded">
                        {p.name}
                      </span>
                    </div>
                  ))}
                </div>
                <input
                  type="url"
                  value={newCover}
                  onChange={(e) => setNewCover(e.target.value)}
                  placeholder="Ou insira a URL de uma imagem personalizada..."
                  className="w-full px-3 py-2 rounded-lg bg-[#181c28] border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-black transition shadow-lg shadow-amber-950/40 disabled:opacity-50"
                >
                  {isSubmitting ? "Criando..." : "Criar Projeto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR NOME E PLANO DE FUNDO */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#12151e] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                Editar Configurações do Projeto
              </h3>
              <button
                onClick={() => setEditingProject(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nome do Projeto
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181c28] border border-slate-700/80 text-sm text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Alterar Plano de Fundo (Capa)
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {COVER_PRESETS.map((p) => (
                    <div
                      key={p.name}
                      onClick={() => setEditCover(p.url)}
                      style={{ backgroundImage: `url('${p.url}')` }}
                      className={`h-16 rounded-lg bg-cover bg-center border-2 cursor-pointer flex items-end p-1.5 transition ${
                        editCover === p.url ? "border-amber-400 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.2 rounded">
                        {p.name}
                      </span>
                    </div>
                  ))}
                </div>
                <input
                  type="url"
                  value={editCover}
                  onChange={(e) => setEditCover(e.target.value)}
                  placeholder="URL da imagem de capa..."
                  className="w-full px-3 py-2 rounded-lg bg-[#181c28] border border-slate-700/80 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-black transition shadow-lg shadow-amber-950/40 disabled:opacity-50"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
