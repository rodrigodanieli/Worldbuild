"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Markdown } from "tiptap-markdown";
import MarkdownIt from "markdown-it";
import { DOMParser } from "@tiptap/pm/model";

import { SecretBlock } from "@/components/editor/extensions/SecretBlock";
import { VideoExtension } from "@/components/editor/extensions/VideoExtension";
import { AudioExtension } from "@/components/editor/extensions/AudioExtension";
import { SlashCommandsExtension } from "@/components/editor/extensions/slash-command";
import { createSlashSuggestion } from "@/components/editor/extensions/slash-suggestion";
import { createMentionSuggestion } from "@/components/editor/extensions/mention-suggestion";
import { CustomMarkdownShortcuts } from "@/components/editor/extensions/markdown-shortcuts";
import { EditorBubbleMenu } from "@/components/editor/EditorBubbleMenu";
import { NotionCardMenu } from "./NotionCardMenu";
import { MentionActionMenu } from "@/components/editor/components/MentionActionMenu";
import { MentionPreviewModal } from "@/components/editor/components/MentionPreviewModal";
import { PageMediaDrawer } from "@/components/editor/components/PageMediaDrawer";
import { MentionPageItem } from "@/components/editor/components/MentionList";
import { CardTagItem } from "./ManageTagsModal";
import { CardCustomField } from "./card-context-types";
import { CardContextBuilder } from "./CardContextBuilder";
import { uploadUniversalMedia, extractMediaFromClipboard } from "@/lib/media-upload";
import {
  CreditCard,
  PanelLeft,
  Lock,
  ImagePlus,
  Maximize2,
  X,
  GripHorizontal,
  Sliders,
  Check,
} from "lucide-react";

export type SaveStatus = "saved" | "saving" | "error" | "unsaved";

export interface CardEditorProps {
  cardId: string;
  projectId: string;
  cardTitle: string;
  category?: string;
  tagId?: string | null;
  tags?: CardTagItem[];
  coverImage?: string | null;
  icon?: string | null;
  properties?: string | Record<string, any>;
  customFields?: string | CardCustomField[];
  initialContent?: string;
  authorName?: string;
  updatedAt?: string;
  allPages?: { id: string; title: string; category?: string }[];
  allCards?: { id: string; title: string; category?: string }[];
  isSidebarCollapsed?: boolean;
  isWindowed?: boolean;
  onToggleSidebar?: () => void;
  onCloseWindow?: () => void;
  onMaximizeWindow?: () => void;
  onCardUpdated?: (title: string, category?: string, tagId?: string) => void;
  onTagsUpdated?: (tags: CardTagItem[]) => void;
}

// Extensão do Mention do TipTap que preserva se é wiki ou card
const CustomMention = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      entityType: {
        default: "wiki",
        parseHTML: (element) => element.getAttribute("data-entity-type") || "wiki",
        renderHTML: (attributes) => ({
          "data-entity-type": attributes.entityType || "wiki",
        }),
      },
    };
  },
});

export function CardEditor({
  cardId,
  projectId,
  cardTitle,
  category = "Personagem / NPC",
  tagId,
  tags = [],
  coverImage,
  icon,
  properties,
  customFields,
  initialContent = "",
  authorName = "Mestre dos Magos",
  updatedAt,
  allPages = [],
  allCards = [],
  isSidebarCollapsed = false,
  isWindowed = false,
  onToggleSidebar,
  onCloseWindow,
  onMaximizeWindow,
  onCardUpdated,
  onTagsUpdated,
}: CardEditorProps) {
  const [title, setTitle] = useState(cardTitle);
  const [cardCategory, setCardCategory] = useState(category);
  const [currentTagId, setCurrentTagId] = useState<string | null>(tagId || null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    updatedAt ? new Date(updatedAt) : null
  );

  // Estados de Capa (Banner), Avatar e Campos do Contexto
  const [cardCoverImage, setCardCoverImage] = useState<string | null>(coverImage || null);
  const [cardIcon, setCardIcon] = useState<string | null>(icon || null);

  // Estados de Controle do Menu (...) e Modo de Edição
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [bannerModalOpen, setBannerModalOpen] = useState<boolean>(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState<boolean>(false);
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState<boolean>(false);
  const [applyTemplateModalOpen, setApplyTemplateModalOpen] = useState<boolean>(false);

  const initialParsedProperties = useMemo<Record<string, any>>(() => {
    if (!properties) return {};
    if (typeof properties === "object") return properties;
    try {
      return JSON.parse(properties);
    } catch (e) {
      return {};
    }
  }, [properties]);

  const [cardProperties, setCardProperties] = useState<Record<string, any>>(initialParsedProperties);

  const initialParsedFields = useMemo<CardCustomField[]>(() => {
    if (!customFields) return [];
    if (Array.isArray(customFields)) return customFields;
    try {
      const parsed = JSON.parse(customFields);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }, [customFields]);

  const [cardCustomFields, setCardCustomFields] = useState<CardCustomField[]>(initialParsedFields);

  // Estados para Menu Interativo do @ e Modal de Preview
  const [mentionMenu, setMentionMenu] = useState<{
    position: { top: number; left: number };
    pageId: string;
    pageTitle: string;
    entityType: "wiki" | "card";
  } | null>(null);

  const [previewPage, setPreviewPage] = useState<{
    pageId: string;
    pageTitle: string;
    entityType: "wiki" | "card";
  } | null>(null);

  // Estado para Drawer de Mídia (Imagens e Vídeos)
  const [isMediaDrawerOpen, setIsMediaDrawerOpen] = useState(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const titleRef = useRef(title);
  titleRef.current = title;
  const categoryRef = useRef(cardCategory);
  categoryRef.current = cardCategory;
  const tagIdRef = useRef(currentTagId);
  tagIdRef.current = currentTagId;

  const coverImageRef = useRef(cardCoverImage);
  coverImageRef.current = cardCoverImage;
  const iconRef = useRef(cardIcon);
  iconRef.current = cardIcon;
  const propertiesRef = useRef(cardProperties);
  propertiesRef.current = cardProperties;
  const customFieldsRef = useRef(cardCustomFields);
  customFieldsRef.current = cardCustomFields;

  // Lista unificada para @mencionar tanto artigos da wiki quanto cards da campanha
  const formattedMentionPages = useMemo<MentionPageItem[]>(() => {
    const wikiItems: MentionPageItem[] = allPages.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category || "other",
      entityType: "wiki",
      snippet: `Artigo da campanha • ID: ${p.id.slice(0, 8)}`,
    }));

    const cardItems: MentionPageItem[] = (allCards || []).map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category || "item",
      entityType: "card",
      snippet: `Card da campanha • ID: ${c.id.slice(0, 8)}`,
    }));

    return [...wikiItems, ...cardItems];
  }, [allPages, allCards]);

  const mentionPagesRef = useRef(formattedMentionPages);
  mentionPagesRef.current = formattedMentionPages;

  // Motor Markdown-it para conversão garantida de Markdown para HTML rico
  const md = useMemo(() => {
    return new MarkdownIt({
      html: true,
      linkify: true,
      breaks: true,
    });
  }, []);

  // Converte conteúdo inicial se for markdown
  const parsedContent = useMemo(() => {
    if (!initialContent || !initialContent.trim()) {
      return `<h1>${cardTitle}</h1><p>Registro do card da campanha. Digite <code>/</code> para blocos, <code>@</code> para referências ou cole imagens diretamente com <code>Ctrl+V</code>.</p>`;
    }
    const trimmed = initialContent.trim();
    if (
      trimmed.startsWith("<") &&
      (trimmed.startsWith("<h1") ||
        trimmed.startsWith("<p") ||
        trimmed.startsWith("<div") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol"))
    ) {
      return trimmed;
    }
    return md.render(initialContent);
  }, [initialContent, cardTitle, md]);

  // Persistência no SQLite via /api/cards/[id]
  const saveToDatabase = useCallback(
    async (
      currentTitle: string,
      currentCategory: string,
      selectedTagId: string | null,
      markdownContent: string,
      jsonContent: any,
      overrideCover?: string | null,
      overrideIcon?: string | null,
      overrideProperties?: Record<string, any>,
      overrideFields?: CardCustomField[]
    ) => {
      setSaveStatus("saving");
      try {
        const response = await fetch(`/api/cards/${cardId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: currentTitle,
            category: currentCategory,
            tagId: selectedTagId ? selectedTagId : null,
            coverImage: overrideCover !== undefined ? overrideCover : coverImageRef.current,
            icon: overrideIcon !== undefined ? overrideIcon : iconRef.current,
            properties: overrideProperties !== undefined ? overrideProperties : propertiesRef.current,
            customFields: overrideFields !== undefined ? overrideFields : customFieldsRef.current,
            contentMarkdown: markdownContent,
            contentJson: jsonContent,
          }),
        });

        if (!response.ok) {
          throw new Error("Falha ao salvar card no SQLite");
        }

        setSaveStatus("saved");
        setLastSavedAt(new Date());

        if (
          onCardUpdated &&
          (currentTitle !== cardTitle ||
            currentCategory !== category ||
            selectedTagId !== tagId)
        ) {
          onCardUpdated(currentTitle, currentCategory, selectedTagId || undefined);
        }
      } catch (err) {
        console.error("Erro no auto-save do card:", err);
        setSaveStatus("error");
      }
    },
    [cardId, onCardUpdated, cardTitle, category, tagId]
  );

  // Instância do TipTap para Card com suporte a Colar Imagens (Ctrl+V)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-2xl max-w-full my-4 border border-slate-800 shadow-2xl",
        },
      }),
      VideoExtension,
      AudioExtension,
      CustomMarkdownShortcuts,
      Markdown.configure({
        html: true,
        tightLists: true,
        bulletListMarker: "-",
        linkify: true,
        breaks: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder:
          "Digite '/' para comandos rápidos, cole imagens com Ctrl+V ou use markdown (# título, - lista)...",
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full border border-slate-800 my-4 text-xs",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border-b border-slate-800",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class:
            "border border-slate-800 bg-slate-900/80 px-3 py-2 text-left font-semibold text-slate-200",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-slate-800/80 px-3 py-2 text-slate-300",
        },
      }),
      SecretBlock,
      SlashCommandsExtension.configure({
        suggestion: createSlashSuggestion(),
      }),
      CustomMention.configure({
        HTMLAttributes: {
          class:
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-medium cursor-pointer hover:bg-amber-500/25 transition not-prose mention-badge",
        },
        suggestion: createMentionSuggestion(() => mentionPagesRef.current),
        renderText({ node }) {
          return `@${node.attrs.label ?? node.attrs.id}`;
        },
      }),
    ],
    content: parsedContent,
    editable: !isLocked,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[400px] text-slate-200 leading-relaxed text-sm selection:bg-sky-500/30",
      },
      handlePaste(view, event) {
        // 1. Suporte a Ingestão Universal de Mídias via Clipboard (Ctrl+V)
        const file = extractMediaFromClipboard(event);
        if (file) {
          event.preventDefault();
          uploadUniversalMedia({
            file,
            projectId,
            resource: "markdown_card",
            cardId,
          })
            .then((data) => {
              if (data.url) {
                const { schema } = view.state;
                if (file.type.startsWith("video/")) {
                  const videoNode = (schema.nodes as any).video?.create({
                    src: data.url,
                  });
                  if (videoNode) {
                    const tr = view.state.tr.replaceSelectionWith(videoNode);
                    view.dispatch(tr);
                  }
                } else if (file.type.startsWith("audio/")) {
                  const audioNode = (schema.nodes as any).audio?.create({
                    src: data.url,
                    title: file.name,
                  });
                  if (audioNode) {
                    const tr = view.state.tr.replaceSelectionWith(audioNode);
                    view.dispatch(tr);
                  }
                } else {
                  const imageNode = schema.nodes.image.create({
                    src: data.url,
                    alt: file.name || "Imagem colada",
                  });
                  const tr = view.state.tr.replaceSelectionWith(imageNode);
                  view.dispatch(tr);
                }
              }
            })
            .catch((err) => console.error("Erro no upload universal do card:", err));

          return true;
        }

        // 2. Intercepta texto markdown estruturado
        const text = event.clipboardData?.getData("text/plain");
        if (
          text &&
          (text.includes("# ") ||
            text.includes("- ") ||
            text.includes("* ") ||
            text.includes("```") ||
            text.includes("1. ") ||
            text.includes("> ") ||
            text.includes("[]") ||
            text.includes("[ ]"))
        ) {
          event.preventDefault();
          const renderedHtml = md.render(text);
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = renderedHtml;

          const parser = DOMParser.fromSchema(view.state.schema);
          const slice = parser.parseSlice(tempDiv);
          const tr = view.state.tr.replaceSelection(slice);
          view.dispatch(tr);
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor: currentEditor }) {
      setSaveStatus("unsaved");
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        const markdown =
          (currentEditor.storage as any)?.markdown?.getMarkdown?.() || currentEditor.getHTML();
        saveToDatabase(
          titleRef.current,
          categoryRef.current,
          tagIdRef.current,
          markdown,
          currentEditor.getJSON()
        );
      }, 700);
    },
    immediatelyRender: false,
  });

  // Intercepta cliques nas @menções para abrir menu suspenso de 3 opções
  useEffect(() => {
    function handleMentionClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest(".mention-badge") as HTMLElement | null;
      if (target) {
        e.preventDefault();
        e.stopPropagation();

        const pageIdAttr = target.getAttribute("data-id") || "";
        const labelAttr = target.getAttribute("data-label") || target.innerText.replace(/^@/, "");
        const entityTypeAttr = (target.getAttribute("data-entity-type") as "wiki" | "card") || "wiki";

        const rect = target.getBoundingClientRect();
        setMentionMenu({
          position: {
            top: rect.bottom + 6,
            left: rect.left + rect.width / 2,
          },
          pageId: pageIdAttr,
          pageTitle: labelAttr,
          entityType: entityTypeAttr,
        });
      }
    }

    document.addEventListener("click", handleMentionClick);
    return () => document.removeEventListener("click", handleMentionClick);
  }, []);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isLocked);
    }
  }, [isLocked, editor]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    titleRef.current = newTitle;
    setSaveStatus("unsaved");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      if (editor) {
        const markdown = (editor.storage as any)?.markdown?.getMarkdown?.() || editor.getHTML();
        saveToDatabase(newTitle, categoryRef.current, tagIdRef.current, markdown, editor.getJSON());
      }
    }, 700);
  };

  const handleTagChange = (selectedTagId: string) => {
    const foundTag = tags.find((t) => t.id === selectedTagId);
    const newName = foundTag ? foundTag.name : cardCategory;

    setCardCategory(newName);
    setCurrentTagId(selectedTagId);
    categoryRef.current = newName;
    tagIdRef.current = selectedTagId;
    setSaveStatus("unsaved");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      if (editor) {
        const markdown = (editor.storage as any)?.markdown?.getMarkdown?.() || editor.getHTML();
        saveToDatabase(titleRef.current, newName, selectedTagId, markdown, editor.getJSON());
      }
    }, 700);
  };

  const handleContextUpdate = (data: {
    coverImage?: string | null;
    icon?: string | null;
    customFields?: CardCustomField[];
    properties?: Record<string, any>;
  }) => {
    if (data.coverImage !== undefined) {
      setCardCoverImage(data.coverImage);
      coverImageRef.current = data.coverImage;
    }
    if (data.icon !== undefined) {
      setCardIcon(data.icon);
      iconRef.current = data.icon;
    }
    if (data.customFields !== undefined) {
      setCardCustomFields(data.customFields);
      customFieldsRef.current = data.customFields;
    }
    if (data.properties !== undefined) {
      setCardProperties(data.properties);
      propertiesRef.current = data.properties;
    }
    setSaveStatus("unsaved");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      if (editor) {
        const markdown = (editor.storage as any)?.markdown?.getMarkdown?.() || editor.getHTML();
        saveToDatabase(
          titleRef.current,
          categoryRef.current,
          tagIdRef.current,
          markdown,
          editor.getJSON(),
          data.coverImage !== undefined ? data.coverImage : coverImageRef.current,
          data.icon !== undefined ? data.icon : iconRef.current,
          data.properties !== undefined ? data.properties : propertiesRef.current,
          data.customFields !== undefined ? data.customFields : customFieldsRef.current
        );
      }
    }, 700);
  };

  const handleSaveAsTagTemplate = async (
    targetTagId: string,
    fieldsToSave: CardCustomField[],
    banner?: string | null,
    avatar?: string | null
  ) => {
    await fetch(`/api/cards/tags/${targetTagId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateFields: fieldsToSave,
        defaultBanner: banner,
        defaultAvatar: avatar,
      }),
    });
  };

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const wordCount = editor?.getText().split(/\s+/).filter(Boolean).length || 0;
  const currentMarkdown =
    (editor?.storage as any)?.markdown?.getMarkdown?.() || editor?.getHTML() || "";

  // Cor da tag atual
  const activeTagObj = tags.find((t) => t.id === currentTagId || t.name === cardCategory);
  const activeTagColor = activeTagObj?.color || "#38bdf8";

  return (
    <div className="flex flex-col h-full w-full bg-[#0d0f14] overflow-hidden relative border border-slate-800/80 rounded-xl shadow-lg">
      {/* Barra de Título no estilo Windows 11 / Gerenciador de Janelas */}
      {isWindowed && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#141724] border-b border-slate-800 select-none shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: activeTagColor }}
            />
            <span className="text-xs font-bold text-slate-200 truncate">{title || "Sem título"}</span>
            <span
              className="text-[10px] px-1.5 py-0.2 rounded font-medium border truncate"
              style={{
                backgroundColor: `${activeTagColor}15`,
                color: activeTagColor,
                borderColor: `${activeTagColor}40`,
              }}
            >
              {cardCategory}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onMaximizeWindow && (
              <button
                type="button"
                onClick={onMaximizeWindow}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Maximizar card em tela cheia"
              >
                <Maximize2 className="h-3 w-3" />
              </button>
            )}

            {onCloseWindow && (
              <button
                type="button"
                onClick={onCloseWindow}
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                title="Fechar janela deste card"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Menu Flutuante ao Selecionar Texto */}
      <EditorBubbleMenu editor={editor} />

      {/* Menu Suspenso Interativo ao Clicar na @Menção */}
      {mentionMenu && (
        <MentionActionMenu
          position={mentionMenu.position}
          pageId={mentionMenu.pageId}
          pageTitle={mentionMenu.pageTitle}
          entityType={mentionMenu.entityType}
          projectId={projectId}
          onClose={() => setMentionMenu(null)}
          onOpenPreview={(id, name, type) =>
            setPreviewPage({ pageId: id, pageTitle: name, entityType: type || "wiki" })
          }
        />
      )}

      {/* Pop-up de Pré-visualização de Leitura da Página ou Card */}
      {previewPage && (
        <MentionPreviewModal
          pageId={previewPage.pageId}
          projectId={projectId}
          fallbackTitle={previewPage.pageTitle}
          entityType={previewPage.entityType}
          onClose={() => setPreviewPage(null)}
        />
      )}

      {/* Drawer de Gerenciamento e Upload de Mídias para este Card */}
      <PageMediaDrawer
        projectId={projectId}
        cardId={cardId}
        editor={editor}
        isOpen={isMediaDrawerOpen}
        onClose={() => setIsMediaDrawerOpen(false)}
      />

      {/* Botão flutuante para reabrir a sidebar quando estiver recolhida (apenas em modo normal) */}
      {!isWindowed && isSidebarCollapsed && onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className="absolute top-4 left-4 z-30 p-2 rounded-xl bg-[#141721]/90 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 shadow-xl transition flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md"
          title="Expandir menu de cards"
        >
          <PanelLeft className="h-4 w-4 text-sky-400" />
          <span>Cards</span>
        </button>
      )}

      {/* Aviso de Card Bloqueado */}
      {isLocked && (
        <div className="bg-sky-950/40 border-b border-sky-800/60 px-4 py-1.5 flex items-center justify-between text-xs text-sky-300 shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-sky-400" />
            <span>Card bloqueado para edições.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsLocked(false)}
            className="underline hover:text-white"
          >
            Desbloquear
          </button>
        </div>
      )}

      {/* Área Central de Escrita Limpa Estilo Notion */}
      <div className="flex-1 overflow-y-auto">
        <div className={`mx-auto pb-16 ${isWindowed ? "pt-2 px-3 max-w-full" : "pt-4 px-8 max-w-4xl"}`}>
          {/* BARRA SUPERIOR DO CARD (ACIMA DOS CAMPOS E BANNER): Tag, Status e Menu de Três Pontos (...) na Direita */}
          <div className="flex items-center justify-between gap-3 mb-3.5 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Seletor de Tag com Cores Customizadas do Projeto (Opcional) */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition"
                style={{
                  backgroundColor: `${activeTagColor}15`,
                  borderColor: `${activeTagColor}44`,
                  color: activeTagColor,
                }}
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: activeTagColor }} />
                <select
                  value={currentTagId || (tags.find((t) => t.name === cardCategory)?.id || "")}
                  onChange={(e) => handleTagChange(e.target.value)}
                  disabled={isLocked}
                  className="bg-transparent border-none text-[11px] font-semibold focus:outline-none cursor-pointer"
                  style={{ color: activeTagColor }}
                >
                  <option value="" className="bg-[#141721] text-slate-300">
                    (Sem Tag)
                  </option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#141721] text-slate-200">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status de Salvamento */}
              <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                {saveStatus === "saving" ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>Salvando...</span>
                  </span>
                ) : saveStatus === "error" ? (
                  <span className="text-rose-400">Erro ao salvar</span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-400">Salvo</span>
                  </span>
                )}
              </div>

              {/* Indicador de Modo de Edição Ativo */}
              {isEditMode && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Sliders className="h-2.5 w-2.5" />
                  <span>Modo Edição Ativo</span>
                </span>
              )}
            </div>

            {/* LADO DIREITO: Menu 3 Pontos (...) do Notion e Controles de Janela */}
            <div className="flex items-center gap-1.5 shrink-0">
              <NotionCardMenu
                cardId={cardId}
                projectId={projectId}
                cardTitle={title}
                isSecret={false}
                isLocked={isLocked}
                isEditMode={isEditMode}
                onToggleEditMode={() => setIsEditMode(!isEditMode)}
                onOpenSaveTemplate={() => setSaveTemplateModalOpen(true)}
                onOpenApplyTemplate={() => setApplyTemplateModalOpen(true)}
                onOpenBannerModal={() => setBannerModalOpen(true)}
                onOpenAvatarModal={() => setAvatarModalOpen(true)}
                wordCount={wordCount}
                lastEditedText={lastSavedAt ? lastSavedAt.toLocaleTimeString() : "Recentemente"}
                authorName={authorName}
                contentMarkdown={currentMarkdown}
                onToggleLock={() => setIsLocked(!isLocked)}
                onToggleSecret={() => {}}
              />

              {isWindowed && (
                <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
                  {onMaximizeWindow && (
                    <button
                      type="button"
                      onClick={onMaximizeWindow}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Maximizar Janela"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {onCloseWindow && (
                    <button
                      type="button"
                      onClick={onCloseWindow}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Fechar Janela"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contexto Superior com Banner, Avatar, Formulário em Linhas/Colunas e Gestão de Templates de Tag */}
          <CardContextBuilder
            cardId={cardId}
            projectId={projectId}
            coverImage={cardCoverImage}
            icon={cardIcon}
            customFields={cardCustomFields}
            properties={cardProperties}
            currentTagId={currentTagId}
            currentTagName={cardCategory}
            tagColor={activeTagColor}
            tags={tags}
            allPages={allPages}
            allCards={allCards}
            isLocked={isLocked}
            isEditMode={isEditMode}
            onToggleEditMode={() => setIsEditMode(!isEditMode)}
            bannerModalOpen={bannerModalOpen}
            avatarModalOpen={avatarModalOpen}
            saveTemplateModalOpen={saveTemplateModalOpen}
            applyTemplateModalOpen={applyTemplateModalOpen}
            onCloseBannerModal={() => setBannerModalOpen(false)}
            onCloseAvatarModal={() => setAvatarModalOpen(false)}
            onCloseSaveTemplateModal={() => setSaveTemplateModalOpen(false)}
            onCloseApplyTemplateModal={() => setApplyTemplateModalOpen(false)}
            onUpdate={handleContextUpdate}
            onSaveAsTagTemplate={handleSaveAsTagTemplate}
            onTagsUpdated={onTagsUpdated}
          />

          {/* Barra de Mídias e Opções de Texto do Markdown */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Conteúdo & Anotações
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsMediaDrawerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 transition"
              title="Adicionar ou visualizar imagens, vídeos e áudios"
            >
              <ImagePlus className="h-3.5 w-3.5 text-sky-400" />
              <span>Anexar Mídia</span>
            </button>
          </div>

          {/* Título Estilo Notion do Card */}
          <div className="mb-4">
            <input
              type="text"
              value={title}
              disabled={isLocked}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Sem título..."
              className={`w-full bg-transparent font-extrabold text-white placeholder-slate-600 focus:outline-none border-b border-transparent focus:border-slate-800 pb-1.5 transition ${
                isWindowed ? "text-2xl" : "text-3xl"
              }`}
            />
          </div>

          {/* Editor TipTap */}
          <div>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
