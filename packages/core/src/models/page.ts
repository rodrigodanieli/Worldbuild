import { z } from "zod";

export const PagePropertyValueSchema = z.object({
  propertyId: z.string(),
  value: z.any(), // Pode ser string, number, array de IDs de páginas, objeto de stats
});

export type PagePropertyValue = z.infer<typeof PagePropertyValueSchema>;

export const PageSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  title: z.string().min(1, "O título da página é obrigatório"),
  slug: z.string(),
  parentId: z.string().uuid().nullable().default(null), // Para hierarquia infinita
  templateId: z.string().optional(),
  icon: z.string().optional(),
  featuredImage: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  
  // Propriedades estruturadas baseadas no template
  properties: z.record(z.string(), z.any()).default({}),
  
  // Conteúdo Rich-Text (TipTap JSON ou Markdown)
  contentJson: z.record(z.string(), z.any()).optional(),
  contentMarkdown: z.string().default(""),
  
  // Visibilidade e Segredos (visível apenas para o mestre / jogadores selecionados)
  isSecret: z.boolean().default(false),
  allowedRoleIds: z.array(z.string()).default([]),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Page = z.infer<typeof PageSchema>;
