import React from "react";
import { createRoot, Root } from "react-dom/client";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { SlashCommandList, getSlashCommands } from "../components/SlashCommandList";
import { CommandItem } from "./slash-command";

export const createSlashSuggestion = () => ({
  items: ({ query }: { query: string }): CommandItem[] => {
    const allCommands = getSlashCommands();
    if (!query) {
      return allCommands;
    }
    const lowerQuery = query.toLowerCase();
    return allCommands.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.id.toLowerCase().includes(lowerQuery)
    );
  },

  render: () => {
    let componentContainer: HTMLElement;
    let root: Root | null = null;
    let popup: TippyInstance[];
    let commandListRef: { onKeyDown: (props: { event: KeyboardEvent }) => boolean } | null = null;

    return {
      onStart: (props: any) => {
        componentContainer = document.createElement("div");

        root = createRoot(componentContainer);
        root.render(
          <SlashCommandList
            ref={(ref) => {
              commandListRef = ref;
            }}
            items={props.items}
            command={props.command}
          />
        );

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: componentContainer,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },

      onUpdate: (props: any) => {
        if (root) {
          root.render(
            <SlashCommandList
              ref={(ref) => {
                commandListRef = ref;
              }}
              items={props.items}
              command={props.command}
            />
          );
        }

        if (popup && popup[0]) {
          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          });
        }
      },

      onKeyDown: (props: any) => {
        if (props.event.key === "Escape") {
          popup?.[0]?.hide();
          return true;
        }
        return commandListRef?.onKeyDown(props) ?? false;
      },

      onExit: () => {
        popup?.[0]?.destroy();
        if (root) {
          setTimeout(() => {
            root?.unmount();
          }, 0);
        }
      },
    };
  },
});
