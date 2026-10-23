"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Plus, Trash2, Calendar, Link2, List, Type, Hash, CheckSquare, Image as ImageIcon, Sliders } from "lucide-react";
import { CardCustomField, FieldType } from "./card-context-types";

interface AddFieldModalProps {
  isOpen: boolean;
  fieldToEdit?: CardCustomField | null;
  onClose: () => void;
  onSave: (field: CardCustomField) => void;
}

export function AddFieldModal({
  isOpen,
  fieldToEdit,
  onClose,
  onSave,
}: AddFieldModalProps) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<FieldType>("text");
  const [width, setWidth] = useState<"1/1" | "1/2" | "1/3" | "1/4">("1/2");
  const [rowSpan, setRowSpan] = useState<1 | 2 | 3>(1);
  const [optionsStr, setOptionsStr] = useState("");
  const [dateFormat, setDateFormat] = useState<"full" | "year">("year");
  const [linkToTimeline, setLinkToTimeline] = useState(false);
  const [placeholder, setPlaceholder] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (fieldToEdit) {
      setLabel(fieldToEdit.label);
      setType(fieldToEdit.type);
      setWidth(fieldToEdit.width || "1/2");
      setRowSpan(fieldToEdit.rowSpan || 1);
      setOptionsStr((fieldToEdit.options || []).join(", "));
      setDateFormat(fieldToEdit.dateFormat || "year");
      setLinkToTimeline(fieldToEdit.linkToTimeline || false);
      setPlaceholder(fieldToEdit.placeholder || "");
    } else {
      setLabel("");
      setType("text");
      setWidth("1/2");
      setRowSpan(1);
      setOptionsStr("");
      setDateFormat("year");
      setLinkToTimeline(false);
      setPlaceholder("");
    }
    setErrorMessage("");
  }, [fieldToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setErrorMessage("Por favor, digite o nome do campo (Display Name).");
      return;
    }

    const parsedOptions = optionsStr
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    const newField: CardCustomField = {
      id: fieldToEdit ? fieldToEdit.id : `fld_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      label: label.trim(),
      type,
      width,
      rowSpan,
      placeholder: placeholder.trim() || undefined,
      options: parsedOptions.length > 0 ? parsedOptions : undefined,
      dateFormat: type === "date" ? dateFormat : undefined,
      linkToTimeline: type === "date" ? linkToTimeline : undefined,
    };

    onSave(newField);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/80 bg-[#141724] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              {fieldToEdit ? "Editar Campo do Contexto" : "Novo Campo de Contexto"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome do Campo (Display Name) <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Idade, Gênero, Raça, Hostilidade, Cidade de Origem..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              autoFocus
            />
          </div>

          {/* Tipo do Campo */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tipo do Campo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FieldType)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
            >
              <optgroup label="Texto e Números">
                <option value="text">Texto Simples (1 Linha)</option>
                <option value="textbox">Caixa de Texto / Textbox (Multilinha / Expansível)</option>
                <option value="number">Número (Inteiro ou Decimal)</option>
              </optgroup>
              <optgroup label="Selects & Comboboxes">
                <option value="select_text">Select de Texto (Opções pré-definidas)</option>
                <option value="combobox_text">Combobox de Texto (Selecionar ou digitar livre)</option>
                <option value="select_number">Select de Número</option>
                <option value="select_reference">Select / Combobox de Referência (Cards e Wikis)</option>
              </optgroup>
              <optgroup label="Vínculos e Referências">
                <option value="reference">Referência Direta (Link para Card ou Artigo Wiki)</option>
              </optgroup>
              <optgroup label="Datas & Cronograma">
                <option value="date">Data (Com opção de vincular à Timeline)</option>
              </optgroup>
              <optgroup label="Outros">
                <option value="checkbox">Checkbox (Sim / Não)</option>
                <option value="image">Imagem / Imagem de Apoio</option>
              </optgroup>
            </select>
          </div>

          {/* Configurações específicas de Select / Combobox */}
          {(type === "select_text" || type === "combobox_text" || type === "select_number") && (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-amber-300">
                Opções da Lista (separadas por vírgula)
              </label>
              <input
                type="text"
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                placeholder="Ex: Humano, Elfo, Anão, Halfling, Draconato"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
              <span className="text-[11px] text-slate-400 block">
                {type === "combobox_text"
                  ? "Dica: Em combobox, o usuário pode escolher uma opção acima ou digitar um novo valor diretamente no card."
                  : "Digite os valores possíveis separados por vírgula."}
              </span>
            </div>
          )}

          {/* Configurações específicas de Data */}
          {type === "date" && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Formato da Data
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="dateFormat"
                      checked={dateFormat === "year"}
                      onChange={() => setDateFormat("year")}
                      className="accent-amber-500"
                    />
                    <span>Apenas Ano (Ex: 1492 ou Ano 124 da 2ª Era)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="dateFormat"
                      checked={dateFormat === "full"}
                      onChange={() => setDateFormat("full")}
                      className="accent-amber-500"
                    />
                    <span>Dia / Mês / Ano (Data Completa)</span>
                  </label>
                </div>
              </div>

              {/* Checkbox para vincular ao Timeline */}
              <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer select-none bg-slate-900/80 p-2.5 rounded-lg border border-amber-500/40">
                <input
                  type="checkbox"
                  checked={linkToTimeline}
                  onChange={(e) => setLinkToTimeline(e.target.checked)}
                  className="h-4 w-4 accent-amber-500 rounded cursor-pointer"
                />
                <div className="flex items-center gap-1.5 text-amber-300">
                  <Calendar className="h-4 w-4" />
                  <span>Vincular ao Cronograma / Timeline automaticamente</span>
                </div>
              </label>
              <span className="text-[11px] text-slate-300 block">
                Quando marcado, todo card que preencher este campo de data irá figurar diretamente na Linha do Tempo do projeto.
              </span>
            </div>
          )}

          {/* Largura da Coluna (Grid Layout) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Largura da Coluna (Layout em Linhas e Colunas)
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setWidth("1/1")}
                className={`py-2 px-1 text-xs rounded-xl border font-medium text-center transition ${
                  width === "1/1"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                100% (1 Coluna)
              </button>
              <button
                type="button"
                onClick={() => setWidth("1/2")}
                className={`py-2 px-1 text-xs rounded-xl border font-medium text-center transition ${
                  width === "1/2"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                50% (2 Colunas)
              </button>
              <button
                type="button"
                onClick={() => setWidth("1/3")}
                className={`py-2 px-1 text-xs rounded-xl border font-medium text-center transition ${
                  width === "1/3"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                33% (3 Colunas)
              </button>
              <button
                type="button"
                onClick={() => setWidth("1/4")}
                className={`py-2 px-1 text-xs rounded-xl border font-medium text-center transition ${
                  width === "1/4"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                25% (4 Colunas)
              </button>
            </div>
          </div>

          {/* Altura / Expansão Vertical (Linhas) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Altura / Expansão Vertical (Linhas)
              </label>
              <span className="text-[11px] font-mono text-amber-400">
                {rowSpan === 1 ? "1 Linha (Padrão)" : `${rowSpan} Linhas (Vertical)`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRowSpan(1)}
                className={`py-2 px-2 text-xs rounded-xl border font-medium text-center transition ${
                  rowSpan === 1
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                1 Linha (Padrão)
              </button>
              <button
                type="button"
                onClick={() => setRowSpan(2)}
                className={`py-2 px-2 text-xs rounded-xl border font-medium text-center transition ${
                  rowSpan === 2
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                2 Linhas (Dupla)
              </button>
              <button
                type="button"
                onClick={() => setRowSpan(3)}
                className={`py-2 px-2 text-xs rounded-xl border font-medium text-center transition ${
                  rowSpan === 3
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                3 Linhas (Tripla)
              </button>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Ideal para imagens ou campos de textbox multilinha que precisam de maior destaque visual vertical.
            </span>
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-400 font-medium">{errorMessage}</p>
          )}

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-lg shadow-amber-950/40"
            >
              <Check className="h-4 w-4" />
              <span>{fieldToEdit ? "Atualizar Campo" : "Adicionar Campo"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
