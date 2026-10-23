export interface SlashCommandItem {
  id: string;
  title: string;
  description: string;
  category: "basic" | "worldbuild" | "rpg" | "media";
  icon: string;
  keywords: string[];
}

export const DEFAULT_SLASH_COMMANDS: SlashCommandItem[] = [
  // Básicos
  {
    id: "heading-1",
    title: "Título Grande (H1)",
    description: "Cabeçalho principal de seção",
    category: "basic",
    icon: "heading-1",
    keywords: ["h1", "titulo", "header"],
  },
  {
    id: "heading-2",
    title: "Subtítulo (H2)",
    description: "Subdivisão de tópico",
    category: "basic",
    icon: "heading-2",
    keywords: ["h2", "subtitulo"],
  },
  {
    id: "bullet-list",
    title: "Lista com Marcadores",
    description: "Lista de itens simples",
    category: "basic",
    icon: "list",
    keywords: ["lista", "bullet", "pontos"],
  },
  {
    id: "table",
    title: "Tabela",
    description: "Insira uma grade estruturada de dados",
    category: "basic",
    icon: "table",
    keywords: ["tabela", "grade", "grid"],
  },

  // Worldbuilding & Segredos
  {
    id: "secret-block",
    title: "Bloco Secreto (Apenas Mestre)",
    description: "Oculto para jogadores; visível apenas para o DM/criador",
    category: "worldbuild",
    icon: "lock",
    keywords: ["segredo", "oculto", "mestre", "dm", "secret"],
  },
  {
    id: "mention-page",
    title: "Vincular Página (@)",
    description: "Conecta a uma página de NPC, Local, Item ou Ficha",
    category: "worldbuild",
    icon: "link",
    keywords: ["link", "pagina", "vincular", "mencao"],
  },
  {
    id: "embed-map",
    title: "Mapa Interativo",
    description: "Embutir uma visão de mapa interativo com pinos",
    category: "worldbuild",
    icon: "map",
    keywords: ["mapa", "cartografia", "pins"],
  },

  // RPG & D&D
  {
    id: "dnd-stat-block",
    title: "Bloco de Monstro / NPC",
    description: "Estatísticas de combate rápidas com rolagens de dados",
    category: "rpg",
    icon: "sword",
    keywords: ["monstro", "statblock", "dnd", "npc", "combate"],
  },
  {
    id: "dice-roller",
    title: "Rolador de Dados",
    description: "Adicione um botão de rolagem interativo (ex: 1d20+4)",
    category: "rpg",
    icon: "dice",
    keywords: ["dado", "rolagem", "d20", "dice"],
  },
];
