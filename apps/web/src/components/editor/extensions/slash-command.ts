import { Extension } from "@tiptap/core";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";

export interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: "basic" | "rpg" | "worldbuild";
  icon: string;
  command: (props: { editor: any; range: any }) => void;
}

export const SlashCommandsExtension = Extension.create<{
  suggestion: Omit<SuggestionOptions<CommandItem>, "editor">;
}>({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
