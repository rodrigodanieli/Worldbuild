export interface DetectedReference {
  id: string; // ID do card ou wiki
  type: "card" | "wiki";
  title: string;
  sourceType: "field" | "mention";
  fieldLabel?: string;
  category?: string;
}

/**
 * Extrai todas as referências encontradas dentro de um card:
 * 1. Campos de contexto (properties: 'card:ID', 'wiki:ID', etc.)
 * 2. Menções @ no Markdown/HTML do conteúdo
 */
export function extractCardReferences(
  card: any,
  allCards: any[],
  allPages: any[]
): DetectedReference[] {
  if (!card) return [];

  const references: DetectedReference[] = [];
  const addedIds = new Set<string>();

  // 1. Extração de Campos de Contexto (properties & customFields)
  let properties: Record<string, any> = {};
  try {
    properties =
      typeof card.properties === "string" ? JSON.parse(card.properties) : card.properties || {};
  } catch {
    properties = {};
  }

  let customFields: any[] = [];
  try {
    customFields =
      typeof card.customFields === "string" ? JSON.parse(card.customFields) : card.customFields || [];
  } catch {
    customFields = [];
  }

  const fieldLabelMap = new Map<string, string>();
  for (const f of customFields) {
    if (f.id && f.label) fieldLabelMap.set(f.id, f.label);
  }

  for (const [key, val] of Object.entries(properties)) {
    if (!val || typeof val !== "string") continue;
    const label = fieldLabelMap.get(key) || "Campo";

    // card:ID
    if (val.startsWith("card:")) {
      const targetId = val.replace("card:", "");
      const found = allCards.find((c) => c.id === targetId);
      if (found && !addedIds.has(found.id) && found.id !== card.id) {
        addedIds.add(found.id);
        references.push({
          id: found.id,
          type: "card",
          title: found.title,
          sourceType: "field",
          fieldLabel: label,
          category: found.category || found.tag?.name,
        });
      }
    }
    // wiki:ID
    else if (val.startsWith("wiki:")) {
      const targetId = val.replace("wiki:", "");
      const found = allPages.find((p) => p.id === targetId);
      if (found && !addedIds.has(found.id)) {
        addedIds.add(found.id);
        references.push({
          id: found.id,
          type: "wiki",
          title: found.title,
          sourceType: "field",
          fieldLabel: label,
          category: found.category,
        });
      }
    }
    // Direct ID match
    else {
      const foundCard = allCards.find((c) => c.id === val);
      if (foundCard && !addedIds.has(foundCard.id) && foundCard.id !== card.id) {
        addedIds.add(foundCard.id);
        references.push({
          id: foundCard.id,
          type: "card",
          title: foundCard.title,
          sourceType: "field",
          fieldLabel: label,
          category: foundCard.category || foundCard.tag?.name,
        });
      }
      const foundPage = allPages.find((p) => p.id === val);
      if (foundPage && !addedIds.has(foundPage.id)) {
        addedIds.add(foundPage.id);
        references.push({
          id: foundPage.id,
          type: "wiki",
          title: foundPage.title,
          sourceType: "field",
          fieldLabel: label,
          category: foundPage.category,
        });
      }
    }
  }

  // 2. Extração de Menções no Conteúdo Markdown
  const markdown = card.contentMarkdown || "";

  // A. data-id="ID" de menções do TipTap
  const mentionMatches = [...markdown.matchAll(/data-id="([^"]+)"/g)];
  for (const m of mentionMatches) {
    const id = m[1];
    if (addedIds.has(id) || id === card.id) continue;

    const foundCard = allCards.find((c) => c.id === id);
    if (foundCard) {
      addedIds.add(id);
      references.push({
        id,
        type: "card",
        title: foundCard.title,
        sourceType: "mention",
        fieldLabel: "Menção @",
        category: foundCard.category || foundCard.tag?.name,
      });
      continue;
    }
    const foundPage = allPages.find((p) => p.id === id);
    if (foundPage) {
      addedIds.add(id);
      references.push({
        id,
        type: "wiki",
        title: foundPage.title,
        sourceType: "mention",
        fieldLabel: "Menção @",
        category: foundPage.category,
      });
    }
  }

  // B. Menções em texto puro (@Título)
  for (const targetCard of allCards) {
    if (targetCard.id === card.id || addedIds.has(targetCard.id)) continue;
    if (!targetCard.title || targetCard.title.length < 2) continue;
    const escaped = targetCard.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`@${escaped}\\b`, "i");
    if (regex.test(markdown)) {
      addedIds.add(targetCard.id);
      references.push({
        id: targetCard.id,
        type: "card",
        title: targetCard.title,
        sourceType: "mention",
        fieldLabel: "Menção @",
        category: targetCard.category || targetCard.tag?.name,
      });
    }
  }

  for (const targetPage of allPages) {
    if (addedIds.has(targetPage.id)) continue;
    if (!targetPage.title || targetPage.title.length < 2) continue;
    const escaped = targetPage.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`@${escaped}\\b`, "i");
    if (regex.test(markdown)) {
      addedIds.add(targetPage.id);
      references.push({
        id: targetPage.id,
        type: "wiki",
        title: targetPage.title,
        sourceType: "mention",
        fieldLabel: "Menção @",
        category: targetPage.category,
      });
    }
  }

  return references;
}
