import { z } from "zod";

export const MapPinSchema = z.object({
  id: z.string().uuid(),
  mapId: z.string().uuid(),
  // Coordenadas normalizadas (0.0 a 1.0) para independência de resolução de tela
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  title: z.string(),
  description: z.string().optional(),
  pageId: z.string().uuid().optional(), // Conexão direta com artigo da wiki
  nestedMapId: z.string().uuid().optional(), // Permite aninhar mapas (Mundo -> Região -> Cidade -> Dungeon)
  icon: z.string().default("map-pin"),
  color: z.string().default("#ef4444"),
  tags: z.array(z.string()).default([]),
  isSecret: z.boolean().default(false), // Visibilidade controlada (oculto para jogadores)
});

export type MapPin = z.infer<typeof MapPinSchema>;

export const WorldMapSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  title: z.string(),
  originalImageUrl: z.string().url(),
  tilesBasePath: z.string(), // Caminho da pirâmide Deep Zoom (DZI / TMS tiles)
  width: z.number().int().positive(), // Ex: 14000
  height: z.number().int().positive(), // Ex: 9000
  maxZoom: z.number().int().default(6),
  minZoom: z.number().int().default(0),
  parentMapId: z.string().uuid().nullable().default(null),
  pins: z.array(MapPinSchema).default([]),
  isSecret: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type WorldMap = z.infer<typeof WorldMapSchema>;
