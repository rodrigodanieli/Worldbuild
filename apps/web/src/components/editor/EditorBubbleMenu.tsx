"use client";

import React, { useEffect, useState, useRef } from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Lock,
} from "lucide-react";

export interface EditorBubbleMenuProps {
  editor: Editor | null;
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;

    const updatePosition = () => {
      const { selection } = editor.state;
      // Exibe apenas se houver texto selecionado (não vazio)
      if (!selection || selection.empty) {
        setPosition(null);
        return;
      }

      try {
        const { from, to } = selection;
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);

        // Posiciona centralizado acima da seleção do usuário
        const left = (start.left + end.right) / 2;
        const top = Math.min(start.top, end.top) - 46;

        setPosition({ top, left });
      } catch (err) {
        setPosition(null);
      }
    };

    editor.on("selectionUpdate", updatePosition);
    editor.on("transaction", updatePosition);

    const handleMouseUp = () => {
      setTimeout(updatePosition, 10);
    };

    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      editor.off("selectionUpdate", updatePosition);
      editor.off("transaction", updatePosition);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [editor]);

  if (!editor || !position) {
    return null;
  }

  const btnClass = (isActive: boolean) =>
    `p-1.5 rounded-lg transition text-xs flex items-center justify-center select-none cursor-pointer ${
      isActive
        ? "bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40"
        : "text-slate-300 hover:text-white hover:bg-slate-800"
    }`;

  // Previne perda da seleção ao clicar no botão
  const handlePreventBlur = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      ref={menuRef}
      className="floating-bubble-menu fixed z-50 -translate-x-1/2 flex items-center gap-0.5 p-1 rounded-xl bg-[#141721]/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-xs animate-in fade-in zoom-in-95 duration-100"
      style={{
        top: `${Math.max(10, position.top)}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Negrito **texto** */}
      <button
        type="button"
        onMouseDown={handlePreventBlur}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive("bold"))}
        title="Negrito (**texto**)"
      >
        <Bold className="h-3.5 w-3.5" />
      </button>

      {/* Itálico *texto* ou _texto_ */}
      <button
        type="button"
        onMouseDown={handlePreventBlur}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive("italic"))}
        title="Itálico (*texto* ou _texto_)"
      >
        <Italic className="h-3.5 w-3.5" />
      </button>

      {/* Tachado ~texto~ ou ~~texto~~ */}
      <button
        type="button"
        onMouseDown={handlePreventBlur}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btnClass(editor.isActive("strike"))}
        title="Tachado (~texto~ ou ~~texto~~)"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </button>

      {/* Código inline `código` */}
      <button
        type="button"
        onMouseDown={handlePreventBlur}
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={btnClass(editor.isActive("code"))}
        title="Código inline (`código`)"
      >
        <Code className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-4 bg-slate-700 mx-1" />

      {/* Título 1 # */}
      <button
        type="button"
        onMouseDown={handlePreventBlur}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btnClass(editor.isActive("heading", { level: 1 }))}
        title="Título 1 (# )"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </button>

      {/* Título 2 ## */}
      <button
        type="button"
        onMouseDown={handlePreventBlur}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive("heading", { level: 2 }))}
        title="Título 2 (## )"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </button>

      {/* Título 3 ### */}
      <button
        type="button"
        onMouseDown={handlePreventBlur}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btnClass(editor.isActive("heading", { level: 3 }))}
        title="Título 3 (### )"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </button>

      {/* Citação > ou " ou | */}
      <button
        type="button"
        onMouseDown={handlePreventBlur}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnClass(editor.isActive("blockquote"))}
        title="Citação (> ou | ou &quot; )"
      >
        <Quote className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-4 bg-slate-700 mx-1" />

      {/* Bloco Secreto DM */}
      <button
        type="button"
        onMouseDown={handlePreventBlur}
        onClick={() => editor.chain().focus().toggleNode("secretBlock", "paragraph").run()}
        className={btnClass(editor.isActive("secretBlock"))}
        title="Segredo do Mestre (DM)"
      >
        <Lock className="h-3.5 w-3.5 text-rose-400" />
      </button>
    </div>
  );
}
