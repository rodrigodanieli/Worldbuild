import { z } from "zod";

export const PropertyTypeSchema = z.enum([
  "text",
  "number",
  "select",
  "multi-select",
  "checkbox",
  "page-relation", // Relacionamento com outra página
  "dnd-attributes", // FOR, DES, CON, INT, SAB, CAR
  "dice-formula", // ex: "1d20 + 5"
  "calendar-date", // Data no calendário fictício do mundo
]);

export type PropertyType = z.infer<typeof PropertyTypeSchema>;

export const PropertyDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: PropertyTypeSchema,
  required: z.boolean().default(false),
  description: z.string().optional(),
  options: z.array(z.string()).optional(), // Para selects
  // Configuração para relações entre páginas (ex: filtrar por categoria ou tag)
  relationFilter: z
    .object({
      targetTemplateId: z.string().optional(),
      requiredTags: z.array(z.string()).optional(),
    })
    .optional(),
  defaultValue: z.any().optional(),
});

export type PropertyDefinition = z.infer<typeof PropertyDefinitionSchema>;

export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum([
    "world",
    "location",
    "language",
    "character-generic",
    "dnd-character-5e",
    "dnd-character-2024",
    "dnd-character-3.5",
    "item",
    "spell",
    "class",
    "faction",
    "custom",
  ]),
  icon: z.string().default("book"),
  defaultTags: z.array(z.string()).default([]),
  properties: z.array(PropertyDefinitionSchema).default([]),
  defaultContent: z.string().default(""), // Conteúdo inicial em Markdown / TipTap JSON
});

export type Template = z.infer<typeof TemplateSchema>;
