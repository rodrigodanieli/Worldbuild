import { Node, mergeAttributes } from "@tiptap/core";

export interface SecretBlockOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    secretBlock: {
      /**
       * Insere um bloco secreto visível apenas para o Mestre
       */
      setSecretBlock: () => ReturnType;
      toggleSecretBlock: () => ReturnType;
    };
  }
}

export const SecretBlock = Node.create<SecretBlockOptions>({
  name: "secretBlock",
  group: "block",
  content: "block+",
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="secret-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "secret-block",
        class:
          "secret-block my-4 p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 text-rose-100 relative group transition-all",
      }),
      [
        "div",
        {
          class:
            "flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-rose-400 select-none pb-2 border-b border-rose-900/50",
          contenteditable: "false",
        },
        "🔒 Segredo do Mestre (Oculto para Jogadores)",
      ],
      ["div", { class: "secret-content pl-1" }, 0],
    ];
  },

  addCommands() {
    return {
      setSecretBlock:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
      toggleSecretBlock:
        () =>
        ({ commands }) => {
          return commands.toggleNode(this.name, "paragraph");
        },
    };
  },
});
