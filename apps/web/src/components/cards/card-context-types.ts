export type FieldType =
  | "text"
  | "textbox"
  | "number"
  | "select_text"
  | "combobox_text"
  | "select_number"
  | "select_reference"
  | "reference"
  | "date"
  | "checkbox"
  | "image";

export interface CardCustomField {
  id: string;
  label: string;
  type: FieldType;
  width?: "1/1" | "1/2" | "1/3" | "1/4";
  rowSpan?: 1 | 2 | 3; // Expansão vertical (1, 2 ou 3 linhas)
  placeholder?: string;
  options?: string[]; // Para selects e comboboxes
  dateFormat?: "full" | "year"; // 'full' = dia/mês/ano, 'year' = apenas ano
  linkToTimeline?: boolean; // Se true, o card aparece automaticamente no cronograma
  referenceType?: "all" | "card" | "wiki"; // Filtro para referências
}

export interface CardTagTemplateItem {
  id: string;
  tagId: string;
  name: string;
  fields: CardCustomField[] | string;
  defaultBanner?: string | null;
  defaultAvatar?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ProjectMediaItem {
  id: string;
  projectId: string;
  userId: string;
  originalName: string;
  hash: string;
  filename: string;
  format: string;
  mediaType: "image" | "video" | "audio";
  sizeBytes: number;
  resource: string;
  url: string;
  createdAt: string | Date;
}

export interface CardContextData {
  coverImage?: string | null;
  icon?: string | null;
  customFields: CardCustomField[];
  properties: Record<string, any>;
}

export const PRESET_BANNERS = [
  { name: "Cidade Medieval", url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80" },
  { name: "Floresta Élfica", url: "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80" },
  { name: "Castelo nas Montanhas", url: "https://images.unsplash.com/photo-1533158307587-828f0a76ef46?auto=format&fit=crop&w=1200&q=80" },
  { name: "Dungeon Arcana", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80" },
  { name: "Reino Flutuante", url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80" },
  { name: "Biblioteca Ancestral", url: "https://images.unsplash.com/photo-1507842229451-7f01be8610ce?auto=format&fit=crop&w=1200&q=80" },
];

export const PRESET_AVATARS = [
  { name: "Guerreiro", url: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=256&q=80" },
  { name: "Mago", url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=256&q=80" },
  { name: "Ladina", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80" },
  { name: "Cidade", url: "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=256&q=80" },
  { name: "Monstro", url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=256&q=80" },
  { name: "Item", url: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=256&q=80" },
];
