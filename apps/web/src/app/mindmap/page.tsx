"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Sparkles, Network, Map as MapIcon } from "lucide-react";
import { KnowledgeGraph } from "@/components/mindmap/KnowledgeGraph";

export default function MindmapPage(): React.JSX.Element {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0d0f14]">
      {/* Barra de Navegação Superior */}
      <header className="z-10 flex h-14 items-center justify-between border-b border-slate-800/80 bg-[#12151e]/90 px-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Hub Principal</span>
          </Link>
          <span className="text-slate-700">/</span>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Network className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">
                Grafo de Conhecimento & Mapa Mental
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/maps"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-[#181c28] hover:border-sky-500/40 text-xs font-semibold text-slate-200 transition"
          >
            <MapIcon className="h-3.5 w-3.5 text-sky-400" />
            <span>Ver Mapas (14K)</span>
          </Link>
          <Link
            href="/wiki"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-[#181c28] hover:border-amber-500/40 text-xs font-semibold text-slate-200 transition"
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            <span>Ir para o Editor Wiki</span>
          </Link>
        </div>
      </header>

      {/* Canvas do Grafo Interativo */}
      <main className="flex-1 w-full h-full relative">
        <KnowledgeGraph />
      </main>
    </div>
  );
}
