"use client";

import React from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Lock,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  Minus,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Database,
} from "lucide-react";

export type SaveStatus = "saved" | "saving" | "error" | "unsaved";

export interface EditorToolbarProps {
  editor: Editor | null;
  isDmMode: boolean;
  onToggleDmMode: () => void;
  saveStatus?: SaveStatus;
  lastSavedAt?: Date | null;
  onRetrySave?: () => void;
}

export function EditorToolbar({
  editor,
  isDmMode,
  onToggleDmMode,
  saveStatus = "saved",
  lastSavedAt,
  onRetrySave,
}: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  const btnClass = (isActive: boolean) =>
    `p-1.5 rounded-md transition text-xs flex items-center justify-center select-none ${
      isActive
        ? "bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm"
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
    }`;

  // Previne perda de seleção ao clicar no botão
  const handlePreventBlur = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-[#12151e]/95 px-3 py-2 backdrop-blur-md">
      {/* Grupo de Formatação de Texto Markdown */}
      <div className="flex items-center gap-1">
        {/* Desfazer / Refazer */}
        <button
          type="button"
          onMouseDown={handlePreventBlur}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 transition"
          title="Desfazer (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={handlePreventBlur}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 transition"
          title="Refazer (Ctrl+Y)"
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-[1px] bg-slate-800" />

        {/* Formatação Básica */}
        <button
          type="button"
          onMouseDown={handlePreventBlur}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive("bold"))}
          title="Negrito (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={handlePreventBlur}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive("italic"))}
          title="Itálico (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={handlePreventBlur}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClass(editor.isActive("strike"))}
          title="Tachado"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={handlePreventBlur}
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={btnClass(editor.isActive("code"))}
          title="Código inline"
        >
          <Code className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-[1px] bg-slate-800" />

        {/* Cabeçalhos H1, H2, H3 */}
        <button
          type="button"
          onMouseDown={handlePreventBlur}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btnClass(editor.isActive("heading", { level: 1 }))}
          title="Título Principal H1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={handlePreventBlur}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClass(editor.isActive("heading", { level: 2 }))}
          title="Subtítulo H2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={handlePreventBlur}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btnClass(editor.isActive("heading", { level: 3 }))}
          title="Seção H3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-[1px] bg-slate-800" />

        {/* Listas & Citações */}
        <button
          type="button"
          onMouseDown={handlePreventBlur}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive("bulletList"))}
          title="Lista com Marcadores"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={handlePreventBlur}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive("orderedList"))}
          title="Lista Numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={handlePreventBlur}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive("blockquote"))}
          title="Citação"
        >
          <Quote className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-[1px] bg-slate-800" />

        {/* Tabela & Divisores */}
        <button
          type="button"
          onMouseDown={handlePreventBlur}
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          className={btnClass(editor.isActive("table"))}
          title="Inserir Tabela"
        >
          <TableIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={handlePreventBlur}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={btnClass(false)}
          title="Linha Divisória"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-[1px] bg-slate-800" />

        {/* Bloco Secreto do Mestre */}
        <button
          type="button"
          onMouseDown={handlePreventBlur}
          onClick={() => editor.chain().focus().toggleNode("secretBlock", "paragraph").run()}
          className={btnClass(editor.isActive("secretBlock"))}
          title="Inserir/Alternar Bloco Secreto do Mestre"
        >
          <Lock className="h-4 w-4 text-rose-400" />
        </button>
      </div>

      {/* Lado Direito: Status de Salvamento e Toggle Modo DM */}
      <div className="flex items-center gap-3">
        {/* Status de Salvamento no Banco SQLite */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded bg-slate-900/90 border border-slate-800">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Salvando no SQLite...</span>
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>Salvo</span>
            </span>
          )}
          {saveStatus === "unsaved" && (
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
              <span>Editando...</span>
            </span>
          )}
          {saveStatus === "error" && (
            <button
              type="button"
              onClick={onRetrySave}
              className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 cursor-pointer"
              title="Clique para tentar salvar novamente"
            >
              <AlertCircle className="h-3 w-3" />
              <span>Erro ao salvar (Reintentar)</span>
            </button>
          )}
        </div>

        {/* Toggle Modo Mestre vs Visão do Jogador */}
        <button
          type="button"
          onClick={onToggleDmMode}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
            isDmMode
              ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
              : "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
          }`}
          title="Alternar entre visão do Mestre (revela segredos) e visão dos Jogadores"
        >
          {isDmMode ? (
            <>
              <Eye className="h-3.5 w-3.5 text-rose-400" />
              <span>Visão Mestre (Segredos ON)</span>
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5 text-emerald-400" />
              <span>Visão Jogador (Segredos Ocultos)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
