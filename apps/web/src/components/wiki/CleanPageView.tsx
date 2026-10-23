"use client";

import React from "react";
import Link from "next/link";
import { Home, Bookmark, ShieldCheck, User } from "lucide-react";

export interface CleanPageViewProps {
  title: string;
  category: string;
  authorName: string;
  contentMarkdown: string;
  properties?: Record<string, any>;
  tags?: string[];
  updatedAt: string;
}

export function CleanPageView({
  title,
  category,
  authorName,
  contentMarkdown,
  properties = {},
  tags = [],
  updatedAt,
}: CleanPageViewProps) {
  return (
    <div className="min-h-screen w-screen bg-[#0d0f14] text-slate-100 flex flex-col select-none">
      {/* Barra Superior Minimalista: Apenas Botão para Home e Badge de Visualização */}
      <header className="h-14 border-b border-slate-800/80 bg-[#12151e]/90 px-6 flex items-center justify-between backdrop-blur-md">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-[#181c28] hover:border-amber-500/50 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition shadow-sm"
        >
          <Home className="h-4 w-4 text-amber-400" />
          <span>Ir para a Home</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/60 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Conteúdo Compartilhado • Modo Somente Leitura</span>
          </span>
        </div>
      </header>

      {/* Conteúdo Central em Formato de Leitura Limpa */}
      <main className="flex-1 overflow-y-auto px-6 py-12">
        <article className="max-w-3xl mx-auto">
          {/* Metadados e Categoria */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <Bookmark className="h-3.5 w-3.5" />
              {category}
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <User className="h-3 w-3 text-slate-500" />
              Criado por {authorName}
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-500">
              Atualizado em {new Date(updatedAt).toLocaleDateString("pt-BR")}
            </span>
          </div>

          {/* Título Principal */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight pb-4 border-b border-slate-800/80 mb-6">
            {title}
          </h1>

          {/* Propriedades Estruturadas (se houver) */}
          {Object.keys(properties).length > 0 && (
            <div className="mb-6 p-4 rounded-xl border border-slate-800 bg-[#141721] grid grid-cols-2 gap-3 text-xs">
              {Object.entries(properties).map(([key, val]) => (
                <div key={key}>
                  <span className="text-slate-500 uppercase tracking-wider text-[10px] block font-semibold">
                    {key}
                  </span>
                  <span className="text-slate-200 font-medium">
                    {typeof val === "object" ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Corpo do Texto em Markdown / HTML Limpo */}
          <div className="prose prose-invert prose-amber max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
            {contentMarkdown.split("\n\n").map((paragraph, index) => {
              if (paragraph.startsWith("## ")) {
                return (
                  <h2 key={index} className="text-xl font-bold text-slate-100 mt-6 mb-2 border-b border-slate-800/60 pb-1">
                    {paragraph.replace("## ", "")}
                  </h2>
                );
              }
              if (paragraph.startsWith("### ")) {
                return (
                  <h3 key={index} className="text-base font-bold text-slate-200 mt-4 mb-1">
                    {paragraph.replace("### ", "")}
                  </h3>
                );
              }
              if (paragraph.startsWith("- ")) {
                const items = paragraph.split("\n- ");
                return (
                  <ul key={index} className="list-disc pl-5 space-y-1">
                    {items.map((it, i) => (
                      <li key={i}>{it.replace("- ", "")}</li>
                    ))}
                  </ul>
                );
              }
              // Oculta blocos secretos de mestre para visualizadores
              if (paragraph.includes(":::secret")) {
                return null;
              }

              return <p key={index}>{paragraph}</p>;
            })}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-8 pt-4 border-t border-slate-800 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#161a26] text-slate-400 border border-slate-800"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
