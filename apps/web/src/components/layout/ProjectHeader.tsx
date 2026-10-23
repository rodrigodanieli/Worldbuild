"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  BookOpen,
  CreditCard,
  Map as MapIcon,
  Clock,
  LayoutDashboard,
  Hammer,
  Settings,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  ChevronRight,
  FolderKanban
} from "lucide-react";

export interface ProjectHeaderProps {
  projectId?: string;
  projectName?: string;
  user: {
    id: string;
    name: string;
    email: string;
    settings?: Record<string, any>;
  };
}

export function ProjectHeader({ projectId, projectName, user }: ProjectHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    }
  };

  const toggleDarkMode = async () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    try {
      await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: nextMode ? "dark" : "light" }),
      });
    } catch (err) {
      console.error("Erro ao salvar tema:", err);
    }
  };

  // Escopos principais: Wiki e Builder (Cards, Mapas, Timeline, Whiteboard)
  const isWikiActive = projectId ? pathname.includes(`/project/${projectId}/wiki`) : false;
  const isCardsActive = projectId ? pathname.includes(`/project/${projectId}/cards`) : false;
  const isMapsActive = projectId ? pathname.includes(`/project/${projectId}/maps`) : false;
  const isTimelineActive = projectId ? pathname.includes(`/project/${projectId}/timeline`) : false;
  const isBoardActive = projectId
    ? pathname.includes(`/project/${projectId}/board`) || pathname.includes(`/project/${projectId}/whiteboard`)
    : false;
  const isBuilderActive = isCardsActive || isMapsActive || isTimelineActive || isBoardActive;

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US";

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-800/80 bg-[#12151e]/95 px-5 backdrop-blur-md select-none">
      {/* 1. Lado Esquerdo: Logo do site + Navegação do Projeto */}
      <div className="flex items-center gap-4">
        {/* Logo que retorna à lista de Projetos */}
        <Link
          href="/"
          className="flex items-center gap-2 group transition"
          title="Ver todos os projetos"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-900/30 group-hover:scale-105 transition">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <span className="font-extrabold text-sm tracking-wide text-white group-hover:text-amber-400 transition hidden sm:inline">
            WorldBuild
          </span>
        </Link>

        {/* Separador e Nome do Projeto com Breadcrumb */}
        {projectName && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
            >
              <FolderKanban className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Projetos</span>
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <span className="text-xs font-bold text-amber-300 truncate max-w-[160px] md:max-w-[220px]">
              {projectName}
            </span>
          </div>
        )}

        {/* Divisão dos 2 Grandes Escopos: WIKI e BUILDER */}
        {projectId && (
          <nav className="flex items-center gap-2 ml-3">
            {/* 1. Escopo WIKI */}
            <Link
              href={`/project/${projectId}/wiki`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isWikiActive
                  ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-400" />
              <span>Wiki</span>
            </Link>

            {/* Separador sutil */}
            <div className="h-4 w-px bg-slate-800" />

            {/* 2. Escopo BUILDER (Cards, Mapas, Timeline, Whiteboard) */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/90">
              <Link
                href={`/project/${projectId}/cards`}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  isBuilderActive
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
                title="Acessar o escopo Builder"
              >
                <Hammer className="h-3.5 w-3.5 text-sky-400" />
                <span className="hidden sm:inline">Builder</span>
              </Link>

              {/* Subferramentas do Builder */}
              <div className="flex items-center gap-0.5 pl-1 border-l border-slate-800">
                <Link
                  href={`/project/${projectId}/cards`}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    isCardsActive
                      ? "bg-sky-500/25 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                  title="Cards da Campanha"
                >
                  <CreditCard className="h-3 w-3 text-sky-400" />
                  <span className="hidden md:inline">Cards</span>
                </Link>

                <Link
                  href={`/project/${projectId}/board`}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    isBoardActive
                      ? "bg-sky-500/25 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                  title="Quadro de Relações e Board"
                >
                  <LayoutDashboard className="h-3 w-3 text-purple-400" />
                  <span className="hidden md:inline">Board</span>
                </Link>

                <Link
                  href={`/project/${projectId}/maps`}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    isMapsActive
                      ? "bg-sky-500/25 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                  title="Mapas e Marcadores"
                >
                  <MapIcon className="h-3 w-3 text-emerald-400" />
                  <span className="hidden md:inline">Mapas</span>
                </Link>

                <Link
                  href={`/project/${projectId}/timeline`}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    isTimelineActive
                      ? "bg-sky-500/25 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                  title="Cronograma / Linha do Tempo"
                >
                  <Clock className="h-3 w-3 text-amber-400" />
                  <span className="hidden md:inline">Timeline</span>
                </Link>
              </div>
            </div>
          </nav>
        )}
      </div>

      {/* 2. Lado Direito: Menu do Profile (Avatar, Email e Dropdown) */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-800/60 border border-slate-700/60 transition"
        >
          {/* Avatar com Iniciais */}
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-black font-extrabold text-xs flex items-center justify-center shadow-sm">
            {userInitials}
          </div>

          {/* Email e Seta */}
          <div className="text-left hidden md:block pr-1">
            <div className="text-xs font-bold text-slate-200 leading-tight">
              {user.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
              {user.email}
            </div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 mr-1 hidden sm:block" />
        </button>

        {/* Menu Suspenso (Dropdown) */}
        {profileOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-700/80 bg-[#141721] p-2 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150 z-50">
            {/* Cabeçalho do Dropdown */}
            <div className="p-2.5 border-b border-slate-800 mb-1">
              <div className="text-xs font-bold text-white">{user.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
            </div>

            {/* Opções do Menu */}
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  alert("Configurações do Usuário (Tema e Preferências salvas na tabela UserSettings)");
                }}
                className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition"
              >
                <Settings className="h-4 w-4 text-amber-400" />
                <span>Configurações / Settings</span>
              </button>

              <button
                onClick={toggleDarkMode}
                className="flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition"
              >
                <div className="flex items-center gap-2.5">
                  {isDarkMode ? (
                    <Moon className="h-4 w-4 text-sky-400" />
                  ) : (
                    <Sun className="h-4 w-4 text-amber-400" />
                  )}
                  <span>Modo Dark</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {isDarkMode ? "ON" : "OFF"}
                </span>
              </button>

              <div className="my-1 border-t border-slate-800" />

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Deslogar / Sair</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
