"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Table, 
  Lock, 
  Minus,
  Sparkles
} from "lucide-react";
import { CommandItem } from "../extensions/slash-command";

export const getSlashCommands = (): CommandItem[] => [
  {
    id: "h1",
    title: "Título Principal (H1)",
    description: "Cabeçalho de grande destaque para seções",
    category: "basic",
    icon: "Heading1",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    id: "h2",
    title: "Subtítulo (H2)",
    description: "Subtítulo para organizar tópicos de lore",
    category: "basic",
    icon: "Heading2",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    id: "h3",
    title: "Seção Menor (H3)",
    description: "Cabeçalho terciário para detalhes",
    category: "basic",
    icon: "Heading3",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    id: "bullet-list",
    title: "Lista com Marcadores",
    description: "Lista de itens simples e ganchos de aventura",
    category: "basic",
    icon: "List",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    id: "ordered-list",
    title: "Lista Numerada",
    description: "Lista ordenada para passos, regras ou cronologias",
    category: "basic",
    icon: "ListOrdered",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    id: "table",
    title: "Tabela",
    description: "Grade para estatísticas, tabelas de encontros e preços",
    category: "basic",
    icon: "Table",
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    id: "quote",
    title: "Citação de Lore",
    description: "Destaque para falas de NPCs ou textos de profecia",
    category: "basic",
    icon: "Quote",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    id: "secret-block",
    title: "Segredo do Mestre (DM Only)",
    description: "Bloco oculto para jogadores; visível apenas pelo Mestre",
    category: "rpg",
    icon: "Lock",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setSecretBlock().run();
    },
  },
  {
    id: "code-block",
    title: "Bloco de Código / Fórmulas",
    description: "Caixa pré-formatada para dados técnicos ou macros",
    category: "basic",
    icon: "Code",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    id: "divider",
    title: "Linha Divisória",
    description: "Separador visual elegante",
    category: "basic",
    icon: "Minus",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

const renderIcon = (icon: string) => {
  switch (icon) {
    case "Heading1":
      return <Heading1 className="h-4 w-4 text-amber-400" />;
    case "Heading2":
      return <Heading2 className="h-4 w-4 text-amber-400" />;
    case "Heading3":
      return <Heading3 className="h-4 w-4 text-amber-400" />;
    case "List":
      return <List className="h-4 w-4 text-sky-400" />;
    case "ListOrdered":
      return <ListOrdered className="h-4 w-4 text-sky-400" />;
    case "Table":
      return <Table className="h-4 w-4 text-emerald-400" />;
    case "Quote":
      return <Quote className="h-4 w-4 text-purple-400" />;
    case "Lock":
      return <Lock className="h-4 w-4 text-rose-400" />;
    case "Code":
      return <Code className="h-4 w-4 text-slate-400" />;
    case "Minus":
      return <Minus className="h-4 w-4 text-slate-400" />;
    default:
      return <Sparkles className="h-4 w-4 text-amber-400" />;
  }
};

export interface SlashCommandListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

export const SlashCommandList = forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  SlashCommandListProps
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (props.items.length === 0) {
    return (
      <div className="z-50 w-72 rounded-xl border border-slate-800 bg-[#141721] p-3 text-xs text-slate-400 shadow-2xl backdrop-blur-md">
        Nenhum comando encontrado...
      </div>
    );
  }

  return (
    <div className="z-50 max-h-80 w-80 overflow-y-auto rounded-xl border border-slate-700/80 bg-[#12151e]/95 p-1.5 shadow-2xl backdrop-blur-xl">
      <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Comandos de Bloco (Digite para filtrar)
      </div>
      <div className="space-y-0.5">
        {props.items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={item.id}
              onClick={() => selectItem(index)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                isSelected
                  ? "bg-amber-500/20 text-white border border-amber-500/40"
                  : "text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-md border ${
                  isSelected
                    ? "border-amber-500/40 bg-amber-500/10"
                    : "border-slate-800 bg-[#181c28]"
                }`}
              >
                {renderIcon(item.icon)}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                  {item.title}
                  {item.category === "rpg" && (
                    <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded font-mono">
                      DM
                    </span>
                  )}
                </div>
                <div className="truncate text-[11px] text-slate-400">{item.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

SlashCommandList.displayName = "SlashCommandList";
