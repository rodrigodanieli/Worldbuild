import { Node, mergeAttributes } from "@tiptap/core";

export interface AudioOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    audio: {
      setAudio: (options: { src: string; title?: string }) => ReturnType;
    };
  }
}

export const AudioExtension = Node.create<AudioOptions>({
  name: "audio",

  group: "block",

  selectable: true,

  draggable: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        controls: "true",
        class: "w-full my-4 rounded-xl border border-slate-700 bg-[#151824] p-2 shadow-lg",
      },
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "audio[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["audio", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addCommands() {
    return {
      setAudio:
        (options: { src: string; title?: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
