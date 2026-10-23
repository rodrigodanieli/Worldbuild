"use client";

import React, { useState } from "react";
import {
  X,
  RotateCcw,
  Layers,
  Trash2,
  Check,
  Sparkles,
  Image as ImageIcon,
  User,
  Plus,
} from "lucide-react";
import { CardCustomField, CardTagTemplateItem } from "./card-context-types";
import { CardTagItem } from "./ManageTagsModal";

interface ApplyTemplateModalProps {
  isOpen: boolean;
  tags: CardTagItem[];
  currentTagId?: string | null;
  currentTagName?: string;
  onClose: () => void;
  onApplyTemplate: (fields: CardCustomField[], banner?: string | null, avatar?: string | null) => void;
  onDeleteTemplate?: (templateId: string, tagId: string) => void;
}

export function ApplyTemplateModal({
  isOpen,
  tags,
  currentTagId,
  currentTagName,
  onClose,
  onApplyTemplate,
  onDeleteTemplate,
}: ApplyTemplateModalProps) {
  const [selectedTagId, setSelectedTagId] = useState<string>(
    currentTagId || (tags.find((t) => t.name === currentTagName)?.id) || tags[0]?.id || ""
  );

  React.useEffect(() => {
    if (isOpen) {
      setSelectedTagId(
        currentTagId || (tags.find((t) => t.name === currentTagName)?.id) || tags[0]?.id || ""
      );
    }
  }, [isOpen, currentTagId, currentTagName, tags]);

  if (!isOpen) return null;

  const activeTag = tags.find((t) => t.id === selectedTagId);
  const templates: CardTagTemplateItem[] = activeTag?.templates || [];

  // Exclusão de template customizado
  const handleDelete = async (templateId: string, templateName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Deseja excluir o template "${templateName}"?`)) return;

    try {
      const res = await fetch(`/api/cards/tags/${selectedTagId}/templates/${templateId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDeleteTemplate?.(templateId, selectedTagId);
      }
    } catch (err) {
      alert("Falha ao excluir template.");
    }
  };

  // Preset inteligente padrão se não houver templates customizados ou como alternativa
  const applyPreset = (presetType: "cidade" | "personagem" | "faccao" | "geral") => {
    let preset: CardCustomField[] = [];
    let banner: string | null = null;

    if (presetType === "cidade") {
      preset = [
        { id: `fld_${Date.now()}_1`, label: "Região do Mundo", type: "text", width: "1/2", placeholder: "Ex: Costa da Espada" },
        { id: `fld_${Date.now()}_2`, label: "Hostilidade / Segurança", type: "select_text", width: "1/2", options: ["Pacífica", "Neutra", "Hostil", "Zona de Guerra"] },
        { id: `fld_${Date.now()}_3`, label: "Governante / Líder", type: "select_reference", width: "1/2" },
        { id: `fld_${Date.now()}_4`, label: "População Estimada", type: "number", width: "1/4", placeholder: "15000" },
        { id: `fld_${Date.now()}_5`, label: "Fundação", type: "date", width: "1/4", dateFormat: "year", linkToTimeline: true },
      ];
      banner = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80";
    } else if (presetType === "personagem") {
      preset = [
        { id: `fld_${Date.now()}_1`, label: "Idade", type: "number", width: "1/4", placeholder: "Ex: 32" },
        { id: `fld_${Date.now()}_2`, label: "Gênero", type: "select_text", width: "1/4", options: ["Masculino", "Feminino", "Não-binário", "Outro"] },
        { id: `fld_${Date.now()}_3`, label: "Raça", type: "combobox_text", width: "1/2", options: ["Humano", "Elfo", "Anão", "Halfling", "Draconato", "Tiefling", "Gnomo", "Meio-Elfo"] },
        { id: `fld_${Date.now()}_4`, label: "Cidade de Origem", type: "select_reference", width: "1/2" },
        { id: `fld_${Date.now()}_5`, label: "Facção / Clã", type: "select_reference", width: "1/2" },
      ];
      banner = "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80";
    } else if (presetType === "faccao") {
      preset = [
        { id: `fld_${Date.now()}_1`, label: "Líder Atual", type: "select_reference", width: "1/2" },
        { id: `fld_${Date.now()}_2`, label: "Sede Principal", type: "select_reference", width: "1/2" },
        { id: `fld_${Date.now()}_3`, label: "Influência", type: "select_text", width: "1/4", options: ["Local", "Regional", "Continental", "Global"] },
        { id: `fld_${Date.now()}_4`, label: "Alinhamento", type: "select_text", width: "1/4", options: ["Ordeiro e Bom", "Neutro", "Caótico", "Maligno"] },
        { id: `fld_${Date.now()}_5`, label: "Recursos & Tropas", type: "text", width: "1/2" },
      ];
    } else {
      preset = [
        { id: `fld_${Date.now()}_1`, label: "Categoria Geral", type: "text", width: "1/2" },
        { id: `fld_${Date.now()}_2`, label: "Data de Criação", type: "date", width: "1/2", dateFormat: "year", linkToTimeline: true },
      ];
    }

    onApplyTemplate(preset, banner, null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700/80 bg-[#141724] p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-sky-400" />
            <div>
              <h3 className="text-base font-bold text-white">Aplicar Template de Tag</h3>
              <p className="text-[11px] text-slate-400">
                Escolha o modelo salvo para carregar a estrutura de campos no card.
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

        {/* Seletor de Tag */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Filtrar Templates por Tag:
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {tags.map((t) => {
              const isSelected = t.id === selectedTagId;
              const count = t.templates?.length || 0;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTagId(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm"
                      : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  <span>{t.name}</span>
                  {count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Templates da Tag */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {templates.length > 0 ? (
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Modelos Salvos para {activeTag?.name}:
              </span>
              {templates.map((tmpl) => {
                const parsedFields: CardCustomField[] =
                  typeof tmpl.fields === "string" ? JSON.parse(tmpl.fields) : tmpl.fields;

                return (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      onApplyTemplate(parsedFields, tmpl.defaultBanner, tmpl.defaultAvatar);
                      onClose();
                    }}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/70 hover:bg-slate-850 cursor-pointer transition group shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white group-hover:text-sky-300 transition">
                          {tmpl.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                          {parsedFields.length} campos
                        </span>
                        {tmpl.defaultBanner && (
                          <span className="text-[10px] text-amber-400 flex items-center gap-0.5" title="Inclui Capa Padrão">
                            <ImageIcon className="h-3 w-3" />
                          </span>
                        )}
                        {tmpl.defaultAvatar && (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5" title="Inclui Avatar Padrão">
                            <User className="h-3 w-3" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {parsedFields.slice(0, 5).map((f, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-[#141724] text-slate-400 border border-slate-800 truncate max-w-[120px]"
                          >
                            {f.label}
                          </span>
                        ))}
                        {parsedFields.length > 5 && (
                          <span className="text-[10px] text-slate-500">
                            +{parsedFields.length - 5} mais
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-sky-600 group-hover:bg-sky-500 text-white font-bold text-xs transition shadow"
                      >
                        Aplicar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(tmpl.id, tmpl.name, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Excluir este template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
              <Layers className="h-6 w-6 text-slate-600 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-300">
                Nenhum template salvo ainda para a tag "{activeTag?.name}"
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Você pode salvar a configuração atual clicando no botão "Salvar Template da Tag".
              </p>
            </div>
          )}

          {/* Seção de Presets Recomendados */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Presets Inteligentes Recomendados:</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => applyPreset("cidade")}
                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-400 text-left transition"
              >
                <div className="text-xs font-bold text-slate-200">🏰 Cidade / Localidade</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Região, Hostilidade, Líder, População, Fundação
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset("personagem")}
                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-400 text-left transition"
              >
                <div className="text-xs font-bold text-slate-200">⚔️ Personagem / NPC</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Idade, Gênero, Raça, Cidade de Origem, Facção
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset("faccao")}
                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-400 text-left transition"
              >
                <div className="text-xs font-bold text-slate-200">🛡️ Facção / Clã</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Líder, Sede Principal, Influência, Tropas
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset("geral")}
                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-400 text-left transition"
              >
                <div className="text-xs font-bold text-slate-200">📜 Registro Básico</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Categoria Geral, Data de Criação
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
