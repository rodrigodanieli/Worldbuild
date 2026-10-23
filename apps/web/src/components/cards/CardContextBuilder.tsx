"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  CardCustomField,
  FieldType,
  CardContextData,
  CardTagTemplateItem,
} from "./card-context-types";
import { AddFieldModal } from "./AddFieldModal";
import { BannerAvatarModal } from "./BannerAvatarModal";
import { SaveTemplateModal } from "./SaveTemplateModal";
import { ApplyTemplateModal } from "./ApplyTemplateModal";
import { CardTagItem } from "./ManageTagsModal";
import {
  Image as ImageIcon,
  User,
  Plus,
  Sliders,
  Settings,
  Trash2,
  Calendar,
  Link2,
  Check,
  ChevronDown,
  Sparkles,
  BookmarkCheck,
  RotateCcw,
  Clock,
  Layers,
  ExternalLink,
  Edit2,
  GripVertical,
  Maximize2,
  Minimize2,
  MoveHorizontal,
  MoveVertical,
} from "lucide-react";

export interface CardContextBuilderProps {
  cardId: string;
  projectId: string;
  coverImage?: string | null;
  icon?: string | null;
  customFields?: CardCustomField[];
  properties?: Record<string, any>;
  currentTagId?: string | null;
  currentTagName?: string;
  tagColor?: string;
  tags?: CardTagItem[];
  allPages?: { id: string; title: string; category?: string }[];
  allCards?: { id: string; title: string; category?: string }[];
  isLocked?: boolean;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
  bannerModalOpen?: boolean;
  avatarModalOpen?: boolean;
  saveTemplateModalOpen?: boolean;
  applyTemplateModalOpen?: boolean;
  onCloseBannerModal?: () => void;
  onCloseAvatarModal?: () => void;
  onCloseSaveTemplateModal?: () => void;
  onCloseApplyTemplateModal?: () => void;
  onUpdate: (data: {
    coverImage?: string | null;
    icon?: string | null;
    customFields?: CardCustomField[];
    properties?: Record<string, any>;
  }) => void;
  onSaveAsTagTemplate?: (
    tagId: string,
    fields: CardCustomField[],
    banner?: string | null,
    avatar?: string | null
  ) => Promise<void>;
  onTagsUpdated?: (tags: CardTagItem[]) => void;
}

const WIDTH_ORDER: Array<"1/4" | "1/3" | "1/2" | "1/1"> = ["1/4", "1/3", "1/2", "1/1"];

export function CardContextBuilder({
  cardId,
  projectId,
  coverImage,
  icon,
  customFields = [],
  properties = {},
  currentTagId,
  currentTagName = "Card",
  tagColor = "#38bdf8",
  tags = [],
  allPages = [],
  allCards = [],
  isLocked = false,
  isEditMode = false,
  onToggleEditMode,
  bannerModalOpen = false,
  avatarModalOpen = false,
  saveTemplateModalOpen = false,
  applyTemplateModalOpen = false,
  onCloseBannerModal,
  onCloseAvatarModal,
  onCloseSaveTemplateModal,
  onCloseApplyTemplateModal,
  onUpdate,
  onSaveAsTagTemplate,
  onTagsUpdated,
}: CardContextBuilderProps) {
  const [fields, setFields] = useState<CardCustomField[]>(customFields);
  const [propValues, setPropValues] = useState<Record<string, any>>(properties);
  const [activeBanner, setActiveBanner] = useState<string | null>(coverImage || null);
  const [activeAvatar, setActiveAvatar] = useState<string | null>(icon || null);

  // Modais Internos
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [fieldToEdit, setFieldToEdit] = useState<CardCustomField | null>(null);
  const [internalBannerOpen, setInternalBannerOpen] = useState(false);
  const [internalAvatarOpen, setInternalAvatarOpen] = useState(false);
  const [internalSaveTemplateOpen, setInternalSaveTemplateOpen] = useState(false);
  const [internalApplyTemplateOpen, setInternalApplyTemplateOpen] = useState(false);
  const [templateSavedFeedback, setTemplateSavedFeedback] = useState(false);

  // Modal para Campos de Imagem (Upload, Ctrl+V, Mídias do Projeto)
  const [imageFieldModalOpen, setImageFieldModalOpen] = useState(false);
  const [activeImageFieldId, setActiveImageFieldId] = useState<string | null>(null);
  const [imageFieldModalTitle, setImageFieldModalTitle] = useState("");

  // Estados de Arrastar e Soltar (Drag & Drop Reordering)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const effectiveBannerOpen = bannerModalOpen || internalBannerOpen;
  const effectiveAvatarOpen = avatarModalOpen || internalAvatarOpen;
  const effectiveSaveTemplateOpen = saveTemplateModalOpen || internalSaveTemplateOpen;
  const effectiveApplyTemplateOpen = applyTemplateModalOpen || internalApplyTemplateOpen;

  const closeBanner = () => {
    setInternalBannerOpen(false);
    onCloseBannerModal?.();
  };
  const closeAvatar = () => {
    setInternalAvatarOpen(false);
    onCloseAvatarModal?.();
  };
  const closeSaveTemplate = () => {
    setInternalSaveTemplateOpen(false);
    onCloseSaveTemplateModal?.();
  };
  const closeApplyTemplate = () => {
    setInternalApplyTemplateOpen(false);
    onCloseApplyTemplateModal?.();
  };

  // Sincroniza se as props mudarem
  useEffect(() => {
    setFields(customFields);
  }, [customFields]);

  useEffect(() => {
    setPropValues(properties);
  }, [properties]);

  useEffect(() => {
    setActiveBanner(coverImage || null);
  }, [coverImage]);

  useEffect(() => {
    setActiveAvatar(icon || null);
  }, [icon]);

  // Atualização de valor de propriedade
  const handlePropChange = (fieldId: string, value: any) => {
    const updated = { ...propValues, [fieldId]: value };
    setPropValues(updated);
    onUpdate({ properties: updated });
  };

  // Salvar ou atualizar campo
  const handleSaveField = (savedField: CardCustomField) => {
    let updatedFields: CardCustomField[];
    const exists = fields.some((f) => f.id === savedField.id);
    if (exists) {
      updatedFields = fields.map((f) => (f.id === savedField.id ? savedField : f));
    } else {
      updatedFields = [...fields, savedField];
    }
    setFields(updatedFields);
    onUpdate({ customFields: updatedFields });
  };

  // Remover campo
  const handleDeleteField = (fieldId: string) => {
    const updatedFields = fields.filter((f) => f.id !== fieldId);
    setFields(updatedFields);
    const updatedProps = { ...propValues };
    delete updatedProps[fieldId];
    setPropValues(updatedProps);
    onUpdate({ customFields: updatedFields, properties: updatedProps });
  };

  // Redimensionamento dinâmico: Cicla a largura do campo
  const handleCycleWidth = (fieldId: string, currentWidth?: string) => {
    const normalized = (currentWidth as "1/4" | "1/3" | "1/2" | "1/1") || "1/2";
    const currentIdx = WIDTH_ORDER.indexOf(normalized);
    const nextWidth = WIDTH_ORDER[(currentIdx + 1) % WIDTH_ORDER.length];

    const updated = fields.map((f) => (f.id === fieldId ? { ...f, width: nextWidth } : f));
    setFields(updated);
    onUpdate({ customFields: updated });
  };

  // Redimensionamento dinâmico interativo via Drag no handle lateral
  const handleResizeStart = (e: React.MouseEvent, fieldId: string, currentWidth?: string) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const initialWidth = (currentWidth as "1/4" | "1/3" | "1/2" | "1/1") || "1/2";
    let lastAppliedWidth = initialWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const diffX = moveEvent.clientX - startX;
      let newWidth = initialWidth;

      if (diffX > 120) {
        newWidth = "1/1";
      } else if (diffX > 50) {
        newWidth = initialWidth === "1/4" ? "1/3" : "1/2";
      } else if (diffX < -120) {
        newWidth = "1/4";
      } else if (diffX < -50) {
        newWidth = initialWidth === "1/1" ? "1/2" : initialWidth === "1/2" ? "1/3" : "1/4";
      }

      if (newWidth !== lastAppliedWidth) {
        lastAppliedWidth = newWidth;
        setFields((prev) =>
          prev.map((f) => (f.id === fieldId ? { ...f, width: newWidth } : f))
        );
      }
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      // Salva alteração final
      setFields((latest) => {
        onUpdate({ customFields: latest });
        return latest;
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Redimensionamento vertical dinâmico: Cicla altura em linhas (1 -> 2 -> 3 -> 1)
  const handleCycleRowSpan = (fieldId: string, currentSpan?: number) => {
    const current = (currentSpan as 1 | 2 | 3) || 1;
    const nextSpan: 1 | 2 | 3 = current === 1 ? 2 : current === 2 ? 3 : 1;
    const updated = fields.map((f) => (f.id === fieldId ? { ...f, rowSpan: nextSpan } : f));
    setFields(updated);
    onUpdate({ customFields: updated });
  };

  // Redimensionamento vertical interativo via drag no handle inferior
  const handleVerticalResizeStart = (e: React.MouseEvent, fieldId: string, currentSpan?: number) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const initialSpan = (currentSpan as 1 | 2 | 3) || 1;
    let lastAppliedSpan = initialSpan;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const diffY = moveEvent.clientY - startY;
      let newSpan: 1 | 2 | 3 = initialSpan;

      if (diffY > 90) {
        newSpan = 3;
      } else if (diffY > 35) {
        newSpan = initialSpan === 3 ? 3 : 2;
      } else if (diffY < -70) {
        newSpan = 1;
      } else if (diffY < -30) {
        newSpan = initialSpan === 3 ? 2 : 1;
      }

      if (newSpan !== lastAppliedSpan) {
        lastAppliedSpan = newSpan;
        setFields((prev) =>
          prev.map((f) => (f.id === fieldId ? { ...f, rowSpan: newSpan } : f))
        );
      }
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setFields((latest) => {
        onUpdate({ customFields: latest });
        return latest;
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Abertura do Modal de Imagem para campo de tipo Imagem
  const handleOpenImageModal = (fieldId: string, label: string) => {
    setActiveImageFieldId(fieldId);
    setImageFieldModalTitle(`Imagem do Campo: ${label}`);
    setImageFieldModalOpen(true);
  };

  // Drag and Drop para Reordenação de Campos (com stopPropagation para não ativar split-screen de cards)
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    e.dataTransfer.setData("application/worldbuild-field", String(index));
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...fields];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    setFields(reordered);
    onUpdate({ customFields: reordered });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Callback após salvar template
  const handleTemplateSaved = (template: CardTagTemplateItem, tagId: string) => {
    setTemplateSavedFeedback(true);
    setTimeout(() => setTemplateSavedFeedback(false), 3500);

    // Atualiza lista de tags local se callback fornecido
    if (onTagsUpdated && tags) {
      const updatedTags = tags.map((t) => {
        if (t.id === tagId) {
          return {
            ...t,
            templates: [template, ...(t.templates || [])],
          };
        }
        return t;
      });
      onTagsUpdated(updatedTags);
    }
  };

  // Callback após aplicar template
  const handleApplyTemplate = (
    templateFields: CardCustomField[],
    banner?: string | null,
    avatar?: string | null
  ) => {
    setFields(templateFields);
    const updatePayload: Record<string, any> = { customFields: templateFields };

    if (banner) {
      setActiveBanner(banner);
      updatePayload.coverImage = banner;
    }
    if (avatar) {
      setActiveAvatar(avatar);
      updatePayload.icon = avatar;
    }

    onUpdate(updatePayload);
  };

  // Callback após excluir template
  const handleDeleteTemplate = (templateId: string, tagId: string) => {
    if (onTagsUpdated && tags) {
      const updatedTags = tags.map((t) => {
        if (t.id === tagId) {
          return {
            ...t,
            templates: (t.templates || []).filter((tmpl) => tmpl.id !== templateId),
          };
        }
        return t;
      });
      onTagsUpdated(updatedTags);
    }
  };

  return (
    <div className="w-full mb-6">
      {/* 1. NOTION-STYLE BANNER (CAPA DO CARD) */}
      <div className="relative group w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 transition">
        {activeBanner ? (
          <div className="relative h-44 sm:h-52 w-full overflow-hidden">
            <img
              src={activeBanner}
              alt="Capa do Card"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f14] via-transparent to-black/30" />

            {/* Ações da Capa no Hover */}
            {!isLocked && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition duration-200">
                <button
                  type="button"
                  onClick={() => setInternalBannerOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-md border border-white/20 shadow-lg transition"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                  <span>Alterar Capa</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveBanner(null);
                    onUpdate({ coverImage: null });
                  }}
                  className="p-1.5 rounded-xl bg-black/60 hover:bg-rose-950/80 text-rose-300 text-xs backdrop-blur-md border border-white/20 shadow-lg transition"
                  title="Remover Capa"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* 2. AVATAR / ÍCONE DO CARD (Sobrepondo a Capa no Estilo Notion) */}
        {activeAvatar ? (
          <div className={`px-4 flex items-end justify-between ${activeBanner ? "-mt-10" : "pt-3 pb-2"}`}>
            <div className="relative group/avatar">
              <div className="relative h-20 w-20 rounded-2xl overflow-hidden border-4 border-[#0d0f14] bg-slate-900 shadow-2xl">
                <img
                  src={activeAvatar}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => setInternalAvatarOpen(true)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition flex items-center justify-center text-[10px] font-bold text-white text-center p-1"
                  >
                    Alterar
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* 3. CONTEXTO & FORMULÁRIO EM LINHAS E COLUNAS */}
      <div className="mt-4 p-4 rounded-2xl bg-[#121521] border border-slate-800/90 shadow-md">
        {/* Cabeçalho Limpo do Contexto */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Campos de Contexto
            </h4>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-bold border"
              style={{
                backgroundColor: `${tagColor}15`,
                borderColor: `${tagColor}40`,
                color: tagColor,
              }}
            >
              Tag: {currentTagName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Feedback de template salvo */}
            {templateSavedFeedback && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <BookmarkCheck className="h-3.5 w-3.5" />
                <span>Modelo Salvo com Sucesso!</span>
              </span>
            )}

            {/* Indicador de Modo de Edição Ativo */}
            {isEditMode ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Sliders className="h-3 w-3" />
                  <span>Modo Edição Ativo</span>
                </span>
                {onToggleEditMode && (
                  <button
                    type="button"
                    onClick={onToggleEditMode}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Concluir
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Dica de Reordenação e Redimensionamento (Apenas no Modo de Edição) */}
        {isEditMode && fields.length > 0 && !isLocked && (
          <div className="mb-3.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-1.5">
              <MoveHorizontal className="h-3.5 w-3.5 text-amber-400" />
              <span>
                Arraste <strong>⠿</strong> para reordenar, puxe a <strong>borda direita</strong> para redimensionar ou adicione campos ao final.
              </span>
            </span>
            <span className="text-[10px] text-amber-400/80 font-mono font-bold">
              {fields.length} campos
            </span>
          </div>
        )}

        {/* Grid de Campos Customizados */}
        {fields.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-800 rounded-xl text-center">
            <Layers className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-300">
              Nenhum campo de contexto configurado para este card.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Adicione campos personalizados ou use o menu de três pontos (...) no topo para aplicar um template.
            </p>
            {!isLocked && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFieldModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Adicionar Primeiro Campo</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 [grid-auto-flow:dense]">
            {fields.map((field, index) => {
              const val = propValues[field.id] ?? "";
              const colSpanClass =
                field.width === "1/1"
                  ? "col-span-1 sm:col-span-12"
                  : field.width === "1/3"
                  ? "col-span-1 sm:col-span-4"
                  : field.width === "1/4"
                  ? "col-span-1 sm:col-span-3"
                  : "col-span-1 sm:col-span-6"; // padrão 1/2

              const rowSpanClass =
                field.rowSpan === 3
                  ? "row-span-1 sm:row-span-3"
                  : field.rowSpan === 2
                  ? "row-span-1 sm:row-span-2"
                  : "row-span-1 sm:row-span-1";

              const minHeightClass =
                field.rowSpan === 3
                  ? "min-h-[250px]"
                  : field.rowSpan === 2
                  ? "min-h-[150px]"
                  : "min-h-[78px]";

              const widthLabel =
                field.width === "1/1"
                  ? "100%"
                  : field.width === "1/3"
                  ? "33%"
                  : field.width === "1/4"
                  ? "25%"
                  : "50%";

              const isDragging = draggedIndex === index;
              const isOver = dragOverIndex === index;

              return (
                <div
                  key={field.id}
                  draggable={isEditMode && !isLocked}
                  onDragStart={(e) => isEditMode && handleDragStart(e, index)}
                  onDragOver={(e) => isEditMode && handleDragOver(e, index)}
                  onDrop={(e) => isEditMode && handleDrop(e, index)}
                  onDragEnd={(e) => isEditMode && handleDragEnd(e)}
                  className={`${colSpanClass} ${rowSpanClass} transition-all duration-150 relative ${
                    isDragging ? "opacity-30 scale-95" : ""
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl bg-slate-900/90 border transition-all duration-150 group/field relative h-full flex flex-col justify-between ${minHeightClass} ${
                      isOver
                        ? "border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-950/20"
                        : "border-slate-800 hover:border-slate-700/80"
                    }`}
                  >
                    {/* Linha Superior: Handle de Drag (só no modo de edição), Rótulo e Ações */}
                    <div className="flex items-center justify-between gap-1.5 mb-1.5 shrink-0">
                      <div className="flex items-center gap-1.5 truncate">
                        {/* Drag Handle (visível apenas no modo de edição) */}
                        {isEditMode && !isLocked && (
                          <div
                            className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-amber-400 p-0.5 rounded transition shrink-0"
                            title="Clique e arraste para reordenar"
                          >
                            <GripVertical className="h-3.5 w-3.5" />
                          </div>
                        )}

                        <span className="text-xs font-bold text-slate-200 truncate">
                          {field.label}
                        </span>

                        {field.linkToTimeline && (
                          <span
                            className="text-[10px] px-1 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-300 flex items-center gap-0.5 shrink-0"
                            title="Sincronizado automaticamente na Timeline / Cronograma"
                          >
                            <Clock className="h-2.5 w-2.5" />
                            <span>Timeline</span>
                          </span>
                        )}
                      </div>

                      {/* Botões de Ação do Campo + Redimensionamento (visíveis apenas no modo de edição) */}
                      {isEditMode && !isLocked && (
                        <div className="flex items-center gap-1">
                          {/* Largura (Horizontal) */}
                          <button
                            type="button"
                            onClick={() => handleCycleWidth(field.id, field.width)}
                            className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-amber-300 hover:bg-slate-700 transition"
                            title="Clique para alternar largura (25% -> 33% -> 50% -> 100%)"
                          >
                            {widthLabel}
                          </button>

                          {/* Altura / Linhas (Vertical) */}
                          <button
                            type="button"
                            onClick={() => handleCycleRowSpan(field.id, field.rowSpan)}
                            className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 hover:text-white hover:bg-slate-700 transition flex items-center gap-0.5 border border-slate-700/60"
                            title={`Alternar altura em linhas (1L -> 2L -> 3L). Atual: ${field.rowSpan || 1} Linha(s)`}
                          >
                            <MoveVertical className="h-2.5 w-2.5 text-sky-400" />
                            <span>{field.rowSpan || 1}L</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setFieldToEdit(field);
                              setIsFieldModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Editar campo"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteField(field.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Excluir campo"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Input Dinâmico de acordo com o Tipo de Campo */}
                    <div className="flex-1 flex flex-col justify-center">
                      {/* 1. TEXTO SIMPLES */}
                      {field.type === "text" && (
                        <input
                          type="text"
                          value={val}
                          disabled={isLocked}
                          onChange={(e) => handlePropChange(field.id, e.target.value)}
                          placeholder={field.placeholder || "Digite o texto..."}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#141724] border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                        />
                      )}

                      {/* 2. TEXTBOX / TEXTAREA MULTILINHA */}
                      {field.type === "textbox" && (
                        <div className="flex-1 flex flex-col pt-0.5">
                          <textarea
                            value={val}
                            disabled={isLocked}
                            onChange={(e) => handlePropChange(field.id, e.target.value)}
                            placeholder={field.placeholder || "Digite o texto..."}
                            className={`w-full flex-1 px-3 py-2 rounded-lg bg-[#141724] border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition leading-relaxed resize-y ${
                              field.rowSpan === 3
                                ? "min-h-[190px]"
                                : field.rowSpan === 2
                                ? "min-h-[100px]"
                                : "min-h-[56px]"
                            }`}
                          />
                        </div>
                      )}

                      {/* 3. NÚMERO */}
                      {field.type === "number" && (
                        <input
                          type="number"
                          value={val}
                          disabled={isLocked}
                          onChange={(e) => handlePropChange(field.id, e.target.value)}
                          placeholder={field.placeholder || "0"}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#141724] border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition font-mono"
                        />
                      )}

                      {/* 4. SELECT TEXT */}
                      {field.type === "select_text" && (
                        <select
                          value={val}
                          disabled={isLocked}
                          onChange={(e) => handlePropChange(field.id, e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#141724] border border-slate-700/80 text-xs text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
                        >
                          <option value="">Selecione uma opção...</option>
                          {(field.options || []).map((opt, i) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* 5. COMBOBOX TEXT */}
                      {field.type === "combobox_text" && (
                        <div className="space-y-1">
                          <input
                            type="text"
                            list={`list-${field.id}`}
                            value={val}
                            disabled={isLocked}
                            onChange={(e) => handlePropChange(field.id, e.target.value)}
                            placeholder="Selecione ou digite novo..."
                            className="w-full px-3 py-1.5 rounded-lg bg-[#141724] border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                          />
                          <datalist id={`list-${field.id}`}>
                            {(field.options || []).map((opt, i) => (
                              <option key={i} value={opt} />
                            ))}
                          </datalist>
                        </div>
                      )}

                      {/* 6. SELECT NUMBER */}
                      {field.type === "select_number" && (
                        <select
                          value={val}
                          disabled={isLocked}
                          onChange={(e) => handlePropChange(field.id, e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#141724] border border-slate-700/80 text-xs text-white focus:outline-none focus:border-amber-500 transition font-mono cursor-pointer"
                        >
                          <option value="">Selecione um número...</option>
                          {(field.options || []).map((opt, i) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* 7. SELECT REFERENCE */}
                      {field.type === "select_reference" && (
                        <select
                          value={val}
                          disabled={isLocked}
                          onChange={(e) => handlePropChange(field.id, e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#141724] border border-slate-700/80 text-xs text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
                        >
                          <option value="">Vincular a outro Card ou Wiki...</option>
                          <optgroup label="Cards da Campanha">
                            {allCards.map((c) => (
                              <option key={c.id} value={`card:${c.id}`}>
                                🗃️ {c.title}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Artigos da Wiki">
                            {allPages.map((p) => (
                              <option key={p.id} value={`wiki:${p.id}`}>
                                📜 {p.title}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      )}

                      {/* 8. REFERENCE GERAL */}
                      {field.type === "reference" && (
                        <div className="flex items-center gap-2">
                          <select
                            value={val}
                            disabled={isLocked}
                            onChange={(e) => handlePropChange(field.id, e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[#141724] border border-slate-700/80 text-xs text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
                          >
                            <option value="">Selecione uma referência...</option>
                            {allCards.map((c) => (
                              <option key={c.id} value={`card:${c.id}`}>
                                🗃️ {c.title} ({c.category || "Card"})
                              </option>
                            ))}
                            {allPages.map((p) => (
                              <option key={p.id} value={`wiki:${p.id}`}>
                                📜 {p.title}
                              </option>
                            ))}
                          </select>
                          {val && (
                            <span className="text-[10px] text-amber-400 shrink-0 font-bold flex items-center gap-0.5">
                              <Link2 className="h-3 w-3" />
                              <span>Vinculado</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* 9. DATA / TIMELINE */}
                      {field.type === "date" && (
                        <div className="space-y-1">
                          {field.dateFormat === "year" ? (
                            <input
                              type="number"
                              value={val}
                              disabled={isLocked}
                              onChange={(e) => handlePropChange(field.id, e.target.value)}
                              placeholder="Ex: 1492 (Ano)"
                              className="w-full px-3 py-1.5 rounded-lg bg-[#141724] border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition font-mono"
                            />
                          ) : (
                            <input
                              type="date"
                              value={val}
                              disabled={isLocked}
                              onChange={(e) => handlePropChange(field.id, e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-[#141724] border border-slate-700/80 text-xs text-white focus:outline-none focus:border-amber-500 transition font-mono"
                            />
                          )}
                        </div>
                      )}

                      {/* 10. CHECKBOX */}
                      {field.type === "checkbox" && (
                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={!!val}
                            disabled={isLocked}
                            onChange={(e) => handlePropChange(field.id, e.target.checked)}
                            className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-[#141724] h-4 w-4 cursor-pointer"
                          />
                          <span className="text-xs text-slate-300">
                            {val ? "Ativo / Marcado" : "Inativo / Desmarcado"}
                          </span>
                        </label>
                      )}

                      {/* 11. IMAGEM (Sem exibir URL em texto, exibe apenas imagem com clique para alterar) */}
                      {field.type === "image" && (
                        <div className="flex-1 flex flex-col pt-0.5">
                          {!val ? (
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => !isLocked && handleOpenImageModal(field.id, field.label)}
                              className={`w-full flex-1 border-2 border-dashed border-slate-700/80 hover:border-amber-400/80 bg-slate-800/30 hover:bg-amber-500/5 rounded-xl flex flex-col items-center justify-center p-3 text-center cursor-pointer transition group/emptyimg ${
                                field.rowSpan === 3
                                  ? "min-h-[190px]"
                                  : field.rowSpan === 2
                                  ? "min-h-[100px]"
                                  : "min-h-[56px]"
                              }`}
                            >
                              <ImageIcon className="h-5 w-5 text-slate-500 group-hover/emptyimg:text-amber-400 group-hover/emptyimg:scale-110 transition mb-1" />
                              <span className="text-xs font-semibold text-slate-300 group-hover/emptyimg:text-amber-300 transition">
                                + Adicionar Imagem
                              </span>
                              <span className="text-[10px] text-slate-500 mt-0.5">
                                Clique para escolher do projeto, colar (Ctrl+V) ou upload
                              </span>
                            </button>
                          ) : (
                            <div
                              className={`w-full flex-1 rounded-xl overflow-hidden border border-slate-800 bg-black/50 relative group/imgfield shadow-inner flex items-center justify-center ${
                                field.rowSpan === 3
                                  ? "min-h-[190px]"
                                  : field.rowSpan === 2
                                  ? "min-h-[100px]"
                                  : "min-h-[56px]"
                              }`}
                            >
                              <img
                                src={val}
                                alt={field.label}
                                className="h-full w-full object-cover"
                              />
                              {!isLocked && (
                                <div className="absolute inset-0 bg-black/65 opacity-0 group-hover/imgfield:opacity-100 transition flex items-center justify-center gap-2 p-2 backdrop-blur-[2px]">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenImageModal(field.id, field.label)}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-lg flex items-center gap-1.5"
                                  >
                                    <ImageIcon className="h-3.5 w-3.5" />
                                    <span>Alterar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePropChange(field.id, "");
                                    }}
                                    className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white transition shadow-lg"
                                    title="Remover Imagem"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Resize Handles Interativos (visíveis apenas no modo de edição) */}
                    {isEditMode && !isLocked && (
                      <>
                        {/* Horizontal Resize */}
                        <div
                          onMouseDown={(e) => handleResizeStart(e, field.id, field.width)}
                          className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-amber-400/40 flex items-center justify-center opacity-0 group-hover/field:opacity-100 transition rounded-r-xl z-10"
                          title="Arraste horizontalmente para redimensionar colunas"
                        >
                          <div className="w-0.5 h-6 bg-slate-500 group-hover/field:bg-amber-400 rounded-full" />
                        </div>

                        {/* Vertical Resize */}
                        <div
                          onMouseDown={(e) => handleVerticalResizeStart(e, field.id, field.rowSpan)}
                          className="absolute left-0 right-0 bottom-0 h-2.5 cursor-row-resize hover:bg-sky-400/40 flex items-center justify-center opacity-0 group-hover/field:opacity-100 transition rounded-b-xl z-10"
                          title="Arraste verticalmente para expandir linhas (1 a 3 linhas)"
                        >
                          <div className="h-0.5 w-8 bg-slate-500 group-hover/field:bg-sky-400 rounded-full" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* BOTÃO DE ADICIONAR NOVO CAMPO NO FINAL DA LISTA DE CAMPOS */}
            {!isLocked && (
              <div className="col-span-1 sm:col-span-6 sm:row-span-1 min-h-[76px]">
                <button
                  type="button"
                  data-testid="add-field-btn"
                  onClick={() => {
                    setFieldToEdit(null);
                    setIsFieldModalOpen(true);
                  }}
                  className="w-full min-h-[76px] h-full border-2 border-dashed border-slate-800 hover:border-amber-400/80 bg-slate-900/40 hover:bg-amber-500/5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-300 transition group p-4"
                >
                  <Plus className="h-4 w-4 text-amber-400 group-hover:scale-110 transition" />
                  <span>+ Adicionar Campo</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAIS DE SUPORTE */}
      <AddFieldModal
        isOpen={isFieldModalOpen}
        fieldToEdit={fieldToEdit}
        onClose={() => {
          setIsFieldModalOpen(false);
          setFieldToEdit(null);
        }}
        onSave={handleSaveField}
      />

      <SaveTemplateModal
        isOpen={effectiveSaveTemplateOpen}
        tags={tags}
        currentTagId={currentTagId}
        fields={fields}
        banner={activeBanner}
        avatar={activeAvatar}
        onClose={closeSaveTemplate}
        onSaved={handleTemplateSaved}
      />

      <ApplyTemplateModal
        isOpen={effectiveApplyTemplateOpen}
        tags={tags}
        currentTagId={currentTagId}
        currentTagName={currentTagName}
        onClose={closeApplyTemplate}
        onApplyTemplate={handleApplyTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />

      <BannerAvatarModal
        isOpen={effectiveBannerOpen}
        mode="banner"
        projectId={projectId}
        cardId={cardId}
        currentUrl={activeBanner}
        onClose={closeBanner}
        onSelect={(url) => {
          setActiveBanner(url);
          onUpdate({ coverImage: url });
        }}
      />

      <BannerAvatarModal
        isOpen={effectiveAvatarOpen}
        mode="avatar"
        projectId={projectId}
        cardId={cardId}
        currentUrl={activeAvatar}
        onClose={closeAvatar}
        onSelect={(url) => {
          setActiveAvatar(url);
          onUpdate({ icon: url });
        }}
      />

      {/* Modal Dedicado para Edição / Upload de Imagem em Campos do Card */}
      <BannerAvatarModal
        isOpen={imageFieldModalOpen}
        mode="image_field"
        projectId={projectId}
        cardId={cardId}
        title={imageFieldModalTitle}
        currentUrl={activeImageFieldId ? propValues[activeImageFieldId] : null}
        onClose={() => {
          setImageFieldModalOpen(false);
          setActiveImageFieldId(null);
        }}
        onSelect={(url) => {
          if (activeImageFieldId) {
            handlePropChange(activeImageFieldId, url || "");
          }
          setImageFieldModalOpen(false);
          setActiveImageFieldId(null);
        }}
      />
    </div>
  );
}
