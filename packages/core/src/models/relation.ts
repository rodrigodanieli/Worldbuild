import { z } from "zod";

export const RelationTypeSchema = z.enum([
  "parent-child",   // Hierarquia de pastas/páginas
  "mention",        // @menção dentro do texto rico
  "property-link",  // Relação através de um campo estruturado (ex: Item -> Equipamento)
  "custom",         // Conexão manual feita no mapa mental
]);

export type RelationType = z.infer<typeof RelationTypeSchema>;

export const PageRelationSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  sourcePageId: z.string().uuid(),
  targetPageId: z.string().uuid(),
  relationType: RelationTypeSchema,
  label: z.string().optional(), // Ex: "Membro de", "Inimigo de", "Localizado em"
});

export type PageRelation = z.infer<typeof PageRelationSchema>;

// Formato de Nó e Aresta para motores de grafo (React Flow / Cytoscape)
export const GraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.string().optional(),
  icon: z.string().optional(),
  tags: z.array(z.string()),
  isSecret: z.boolean(),
});

export type GraphNode = z.infer<typeof GraphNodeSchema>;

export const GraphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  type: RelationTypeSchema,
});

export type GraphEdge = z.infer<typeof GraphEdgeSchema>;
