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

import { SecretBlock } from "./extensions/SecretBlock";
import { VideoExtension } from "./extensions/VideoExtension";
import { AudioExtension } from "./extensions/AudioExtension";
import { SlashCommandsExtension } from "./extensions/slash-command";
import { createSlashSuggestion } from "./extensions/slash-suggestion";
import { createMentionSuggestion } from "./extensions/mention-suggestion";
import { CustomMarkdownShortcuts } from "./extensions/markdown-shortcuts";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { NotionPageMenu } from "@/components/wiki/NotionPageMenu";
import { MentionActionMenu } from "./components/MentionActionMenu";
import { MentionPreviewModal } from "./components/MentionPreviewModal";
import { PageMediaDrawer } from "./components/PageMediaDrawer";
import { MentionPageItem } from "./components/MentionList";
import { uploadUniversalMedia, extractMediaFromClipboard } from "@/lib/media-upload";
import {
  Bookmark,
  Clock,
  PanelLeft,
  Lock,
  Eye,
  EyeOff,
  ImagePlus,
} from "lucide-react";

export type SaveStatus = "saved" | "saving" | "error" | "unsaved";

export interface WikiEditorProps {
  pageId: string;
  projectId: string;
  pageTitle: string;
  category?: string;
  initialContent?: string;
  isSecret?: boolean;
  authorName?: string;
  updatedAt?: string;
  allPages?: { id: string; title: string; category?: string }[];
  allCards?: { id: string; title: string; category?: string }[];
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onToggleSecret?: (newSecret: boolean) => void;
  onPageUpdated?: (title: string) => void;
}

// Extensão do Mention do TipTap que preserva o tipo da entidade (wiki vs card)
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

export function WikiEditor({
  pageId,
  projectId,
  pageTitle,
  category = "Artigo Geral",
  initialContent = "",
  isSecret = false,
  authorName = "Mestre dos Magos",
  updatedAt,
  allPages = [],
  allCards = [],
  isSidebarCollapsed = false,
  onToggleSidebar,
  onToggleSecret,
  onPageUpdated,
}: WikiEditorProps) {
  const [isDmMode, setIsDmMode] = useState<boolean>(true);
  const [title, setTitle] = useState(pageTitle);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    updatedAt ? new Date(updatedAt) : null
  );

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

  // Lista unificada e categorizada para @mencionar tanto artigos da wiki quanto cards da campanha
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
      return `<h1>${pageTitle}</h1><p>Comece a registrar as localidades, facções, personagens e segredos desta campanha. Digite <code>/</code> para inserir blocos ou <code>@</code> para criar conexões.</p>`;
    }
    const trimmed = initialContent.trim();
    if (trimmed.startsWith("<") && (trimmed.startsWith("<h1") || trimmed.startsWith("<p") || trimmed.startsWith("<div") || trimmed.startsWith("<ul") || trimmed.startsWith("<ol"))) {
      return trimmed;
    }
    return md.render(initialContent);
  }, [initialContent, pageTitle, md]);

  // Persistência no SQLite via /api/pages/[id]
  const saveToDatabase = useCallback(
    async (currentTitle: string, markdownContent: string, jsonContent: any) => {
      setSaveStatus("saving");
      try {
        const response = await fetch(`/api/pages/${pageId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: currentTitle,
            contentMarkdown: markdownContent,
            contentJson: jsonContent,
          }),
        });

        if (!response.ok) {
          throw new Error("Falha ao salvar no SQLite");
        }

        setSaveStatus("saved");
        setLastSavedAt(new Date());

        if (onPageUpdated && currentTitle !== pageTitle) {
          onPageUpdated(currentTitle);
        }
      } catch (err) {
        console.error("Erro no auto-save:", err);
        setSaveStatus("error");
      }
    },
    [pageId, onPageUpdated, pageTitle]
  );

  // Instância do TipTap com extensões completas incluindo Imagens e Vídeos
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
          "Digite '/' para comandos rápidos ou use markdown (# título, - lista, [] checklist)...",
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class:
            "border-collapse table-auto w-full border border-slate-800 my-4 text-xs",
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
          "prose prose-invert max-w-none focus:outline-none min-h-[550px] text-slate-200 leading-relaxed text-sm selection:bg-amber-500/30",
      },
      handlePaste(view, event) {
        // 1. Suporte a Ingestão Universal de Mídias via Clipboard (Ctrl+V)
        const file = extractMediaFromClipboard(event);
        if (file) {
          event.preventDefault();
          uploadUniversalMedia({
            file,
            projectId,
            resource: "pagina_wiki",
            pageId,
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
            .catch((err) => console.error("Erro no upload universal colado:", err));

          return true;
        }

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
        const markdown = (currentEditor.storage as any)?.markdown?.getMarkdown?.() || currentEditor.getHTML();
        saveToDatabase(
          titleRef.current,
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
        saveToDatabase(newTitle, markdown, editor.getJSON());
      }
    }, 700);
  };

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const wordCount = editor?.getText().split(/\s+/).filter(Boolean).length || 0;
  const currentMarkdown = (editor?.storage as any)?.markdown?.getMarkdown?.() || editor?.getHTML() || "";

  return (
    <div className="flex flex-col h-full w-full bg-[#0d0f14] overflow-hidden relative">
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

      {/* Drawer de Gerenciamento e Upload de Mídias (Imagens & Vídeos) */}
      <PageMediaDrawer
        projectId={projectId}
        pageId={pageId}
        editor={editor}
        isOpen={isMediaDrawerOpen}
        onClose={() => setIsMediaDrawerOpen(false)}
      />

      {/* Botão flutuante para reabrir a sidebar quando estiver recolhida */}
      {isSidebarCollapsed && onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className="absolute top-4 left-4 z-30 p-2 rounded-xl bg-[#141721]/90 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 shadow-xl transition flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md"
          title="Expandir menu de páginas"
        >
          <PanelLeft className="h-4 w-4 text-amber-400" />
          <span>Menu</span>
        </button>
      )}

      {/* Aviso de Página Bloqueada */}
      {isLocked && (
        <div className="bg-amber-950/40 border-b border-amber-800/60 px-6 py-2 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>Esta página está bloqueada para prevenir edições acidentais.</span>
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
        <div className="max-w-4xl mx-auto pt-8 pb-20 px-8">
          {/* Top Row com Categoria, Mídias, Status de Salvamento e Menu 3 Pontos (...) */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Bookmark className="h-3 w-3" />
                {category}
              </span>
              <span className="text-xs text-slate-600">•</span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>
                  {saveStatus === "saving" ? "Salvando..." : "Persistência SQLite Ativa"}
                </span>
              </span>
            </div>

            {/* Ações da Página: Botão de Mídias, Visão DM e Menu 3 Pontos (...) do Notion */}
            <div className="flex items-center gap-2">
              {/* Botão de Anexar Mídias (Imagens e Vídeos) */}
              <button
                type="button"
                onClick={() => setIsMediaDrawerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 transition"
                title="Adicionar ou gerenciar imagens e vídeos da página"
              >
                <ImagePlus className="h-3.5 w-3.5 text-amber-400" />
                <span>Mídias</span>
              </button>

              {/* Toggle Rápido Visão Mestre / Visão Jogador */}
              <button
                type="button"
                onClick={() => setIsDmMode(!isDmMode)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  isDmMode
                    ? "bg-rose-950/40 border-rose-500/30 text-rose-300"
                    : "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                }`}
                title="Alternar entre visão do Mestre (revela segredos) e visão dos Jogadores"
              >
                {isDmMode ? (
                  <>
                    <Eye className="h-3.5 w-3.5 text-rose-400" />
                    <span>Visão Mestre</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Visão Jogador</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-slate-500 hidden sm:inline-block">
                {lastSavedAt
                  ? `Salvo ${lastSavedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                  : "Salvo"}
              </span>

              {/* Botão 3 Pontos (...) do Notion com Opções da Página */}
              <NotionPageMenu
                pageId={pageId}
                projectId={projectId}
                pageTitle={title}
                isSecret={isSecret}
                isLocked={isLocked}
                wordCount={wordCount}
                lastEditedText={
                  lastSavedAt
                    ? `hoje às ${lastSavedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                    : "hoje"
                }
                authorName={authorName}
                contentMarkdown={currentMarkdown}
                allPages={allPages}
                onToggleLock={() => setIsLocked(!isLocked)}
                onToggleSecret={(newSec) => {
                  if (onToggleSecret) onToggleSecret(newSec);
                }}
              />
            </div>
          </div>

          {/* Título da Página */}
          <div className="mb-6">
            <input
              type="text"
              value={title}
              disabled={isLocked}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Título da Página..."
              className="w-full text-4xl font-extrabold text-white bg-transparent border-none outline-none tracking-tight placeholder-slate-600 focus:ring-0 disabled:opacity-80"
            />
          </div>

          {/* Editor TipTap com visual limpo e suporte total a Markdown */}
          <div className={`wiki-content-wrapper ${!isDmMode ? "hide-secrets" : ""}`}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Rodapé Notion */}
      <footer className="border-t border-slate-800/80 bg-[#12151e]/80 px-6 py-2.5 text-xs text-slate-500 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span>{wordCount} palavras</span>
          <span>•</span>
          <span className="text-slate-400">
            Clique na @menção para opções de navegação • Digite <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">/</kbd> para comandos ou use markdown direto
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>
              {lastSavedAt
                ? `Salvo no SQLite: ${lastSavedAt.toLocaleTimeString("pt-BR")}`
                : "Aguardando escrita"}
            </span>
          </span>
        </div>
      </footer>
    </div>
  );
}
