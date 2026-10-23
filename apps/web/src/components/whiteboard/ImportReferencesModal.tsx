"use client";

import React, { useState, useEffect } from "react";
import { X, Check, CreditCard, BookOpen, Link2, Sparkles, Layers } from "lucide-react";
import { DetectedReference } from "./reference-extractor";

interface ImportReferencesModalProps {
  isOpen: boolean;
  card: any;
  references: DetectedReference[];
  onClose: () => void;
  onConfirm: (options: { bringCardRefs: boolean; bringWikiRefs: boolean }) => void;
}

export function ImportReferencesModal({
  isOpen,
  card,
  references,
  onClose,
  onConfirm,
}: ImportReferencesModalProps) {
  const [bringCardRefs, setBringCardRefs] = useState(true);
  const [bringWikiRefs, setBringWikiRefs] = useState(true);

  const cardRefs = references.filter((r) => r.type === "card");
  const wikiRefs = references.filter((r) => r.type === "wiki");

  useEffect(() => {
    if (isOpen) {
      setBringCardRefs(cardRefs.length > 0);
      setBringWikiRefs(wikiRefs.length > 0);
    }
  }, [isOpen, cardRefs.length, wikiRefs.length]);

  if (!isOpen || !card) return null;

  const handleConfirm = () => {
    onConfirm({ bringCardRefs, bringWikiRefs });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/80 bg-[#141724] p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Topo do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Adicionar Card ao Board</h3>
              <p className="text-xs text-slate-400">
                Configure a importação de relações e interligações automáticas
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

        {/* Card sendo inserido */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 mb-4">
          {card.icon ? (
            <img src={card.icon} alt="Avatar" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <CreditCard className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white truncate">{card.title}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {card.category || card.tag?.name || "Card"}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {references.length} referência{references.length === 1 ? "" : "s"} detectada{references.length === 1 ? "" : "s"} no conteúdo e campos.
            </p>
          </div>
        </div>

        {/* Opções de Importação com Checkboxes */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {/* Opção 1: Trazer referências de cards */}
          <div className="p-3.5 rounded-xl bg-[#181b2a] border border-slate-800 space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={bringCardRefs}
                disabled={cardRefs.length === 0}
                onChange={(e) => setBringCardRefs(e.target.checked)}
                className="h-4 w-4 rounded accent-sky-500 bg-slate-900 border-slate-700 cursor-pointer disabled:opacity-40"
              />
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-sky-400" />
                <span>Trazer referências de cards vinculados</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  ({cardRefs.length} encontrado{cardRefs.length === 1 ? "" : "s"})
                </span>
              </span>
            </label>

            {cardRefs.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pl-6 pt-1">
                {cardRefs.map((ref) => (
                  <span
                    key={ref.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-[11px] text-sky-200"
                  >
                    <Link2 className="h-3 w-3 text-sky-400" />
                    <span className="font-semibold">{ref.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({ref.fieldLabel})</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 pl-6">
                Nenhum outro card vinculado nos campos ou menções deste card.
              </p>
            )}
          </div>

          {/* Opção 2: Trazer referências de páginas da wiki */}
          <div className="p-3.5 rounded-xl bg-[#181b2a] border border-slate-800 space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={bringWikiRefs}
                disabled={wikiRefs.length === 0}
                onChange={(e) => setBringWikiRefs(e.target.checked)}
                className="h-4 w-4 rounded accent-amber-500 bg-slate-900 border-slate-700 cursor-pointer disabled:opacity-40"
              />
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                <span>Trazer referências de páginas da wiki vinculadas</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  ({wikiRefs.length} encontrada{wikiRefs.length === 1 ? "" : "s"})
                </span>
              </span>
            </label>

            {wikiRefs.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pl-6 pt-1">
                {wikiRefs.map((ref) => (
                  <span
                    key={ref.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200"
                  >
                    <BookOpen className="h-3 w-3 text-amber-400" />
                    <span className="font-semibold">{ref.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({ref.fieldLabel})</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 pl-6">
                Nenhum artigo da wiki referenciado neste card.
              </p>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Ao confirmar, os elementos selecionados serão organizados ao redor do card e as
              linhas de interligação serão conectadas automaticamente.
            </span>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold transition shadow-lg shadow-sky-950/40"
          >
            <Check className="h-4 w-4" />
            <span>Inserir no Board</span>
          </button>
        </div>
      </div>
    </div>
  );
}
