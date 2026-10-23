"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import MarkdownIt from "markdown-it";
import { X, ExternalLink, Bookmark, Loader2, ArrowRight, CreditCard } from "lucide-react";

export interface MentionPreviewModalProps {
  pageId: string;
  projectId: string;
  fallbackTitle: string;
  entityType?: "wiki" | "card";
  onClose: () => void;
}

export function MentionPreviewModal({
  pageId,
  projectId,
  fallbackTitle,
  entityType = "wiki",
  onClose,
}: MentionPreviewModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const md = useMemo(() => new MarkdownIt({ html: true, linkify: true, breaks: true }), []);
  const isCard = entityType === "card";
  const fetchUrl = isCard ? `/api/cards/${pageId}` : `/api/pages/${pageId}`;
  const fullUrl = isCard ? `/project/${projectId}/cards/${pageId}` : `/project/${projectId}/wiki/${pageId}`;

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error("Erro ao carregar");
        const json = await res.json();
        if (mounted) {
          setData(isCard ? json.card : json.page);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => {
      mounted = false;
    };
  }, [fetchUrl, isCard]);

  const renderedContent = useMemo(() => {
    if (!data?.contentMarkdown) return "<p>Nenhum conteúdo adicionado ainda.</p>";
    const raw = data.contentMarkdown.trim();
    if (raw.startsWith("<") && (raw.startsWith("<h1") || raw.startsWith("<p") || raw.startsWith("<div"))) {
      return raw;
    }
    return md.render(raw);
  }, [data, md]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#141721] border border-slate-700 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Top Header do Modal de Pré-visualização */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#10131b]">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                isCard
                  ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              {isCard ? (
                <CreditCard className="h-3 w-3" />
              ) : (
                <Bookmark className="h-3 w-3" />
              )}
              {data?.category || (isCard ? "Card da Campanha" : data?.template?.name || "Artigo da Wiki")}
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Modo de Leitura Rápida</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(fullUrl);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              title={`Ir para o ${isCard ? "card" : "artigo"} completo`}
            >
              <span>Abrir {isCard ? "Card" : "Artigo"}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo Renderizado da Página ou Card */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 text-xs">
              <Loader2
                className={`h-6 w-6 animate-spin ${isCard ? "text-sky-400" : "text-amber-400"}`}
              />
              <span>Carregando pré-visualização de {fallbackTitle}...</span>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-extrabold text-white mb-4">
                {data?.title || fallbackTitle}
              </h2>
              <div
                className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderedContent }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
