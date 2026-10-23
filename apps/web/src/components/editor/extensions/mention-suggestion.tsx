import React from "react";
import { createRoot, Root } from "react-dom/client";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { MentionList, MentionPageItem } from "../components/MentionList";

export const createMentionSuggestion = (getItems: () => MentionPageItem[]) => ({
  items: ({ query }: { query: string }): MentionPageItem[] => {
    const allItems = typeof getItems === "function" ? getItems() : [];
    
    // Se ainda não digitou nada após o @, apresenta os 3 primeiros de cada sessão para caber perfeitamente na visualização
    if (!query || !query.trim()) {
      const wikis = allItems.filter((i) => i.entityType !== "card").slice(0, 3);
      const cards = allItems.filter((i) => i.entityType === "card").slice(0, 3);
      return [...wikis, ...cards];
    }

    // Assim que começar a digitar, filtra em tempo real por título ou categoria
    const lowerQuery = query.toLowerCase().trim();
    const filtered = allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery) ||
        (item.snippet && item.snippet.toLowerCase().includes(lowerQuery))
    );
    const wikis = filtered.filter((i) => i.entityType !== "card").slice(0, 8);
    const cards = filtered.filter((i) => i.entityType === "card").slice(0, 8);
    return [...wikis, ...cards];
  },

  render: () => {
    let componentContainer: HTMLElement;
    let root: Root | null = null;
    let popup: TippyInstance[];
    let mentionListRef: { onKeyDown: (props: { event: KeyboardEvent }) => boolean } | null = null;

    return {
      onStart: (props: any) => {
        componentContainer = document.createElement("div");

        root = createRoot(componentContainer);
        root.render(
          <MentionList
            ref={(ref) => {
              mentionListRef = ref;
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
            <MentionList
              ref={(ref) => {
                mentionListRef = ref;
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
          if (popup && popup[0]) {
            popup[0].hide();
          }
          return true;
        }

        return mentionListRef?.onKeyDown(props) || false;
      },

      onExit: () => {
        if (popup && popup[0]) {
          popup[0].destroy();
        }
        if (root) {
          root.unmount();
        }
      },
    };
  },
});
