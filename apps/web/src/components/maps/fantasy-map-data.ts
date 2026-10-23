export interface MapPinData {
  id: string;
  title: string;
  category: "capital" | "city" | "dungeon" | "landmark" | "tavern" | "secret";
  x: number;
  y: number;
  description: string;
  pageId?: string;
  nestedMapId?: string;
  color: string;
  tags: string[];
  isSecret?: boolean;
}

export interface MapData {
  id: string;
  title: string;
  subtitle: string;
  category: "world" | "region" | "dungeon";
  width: number;
  height: number;
  backgroundSvgTheme: "world" | "city" | "dungeon";
  parentMapId?: string;
  pins: MapPinData[];
}

export const MAPS_DATABASE: MapData[] = [
  {
    id: "map-eldoria-world",
    title: "Continente de Eldoria",
    subtitle: "Visão Geral do Continente e Grandes Regiões",
    category: "world",
    width: 2400,
    height: 1600,
    backgroundSvgTheme: "world",
    pins: [
      {
        id: "pin-valefundo",
        title: "Capital Valefundo",
        category: "capital",
        x: 950,
        y: 820,
        description: "A grande cidadela das quatro torres, centro econômico e militar do reino.",
        pageId: "loc-1",
        nestedMapId: "map-valefundo-city",
        color: "#38bdf8",
        tags: ["capital", "cidade", "centro"],
      },
      {
        id: "pin-montanhas",
        title: "Montanhas Cinzentas",
        category: "landmark",
        x: 650,
        y: 420,
        description: "Cordilheira inóspita onde jazem as forjas anãs e ninhos de wyverns.",
        pageId: "loc-montanhas",
        color: "#fbbf24",
        tags: ["montanhas", "anões", "perigo"],
      },
      {
        id: "pin-floresta-sussurros",
        title: "Floresta dos Sussurros",
        category: "landmark",
        x: 1650,
        y: 650,
        description: "Bosque antigo guardado por elfos selvagens e portais planares instáveis.",
        pageId: "loc-floresta",
        color: "#10b981",
        tags: ["floresta", "elfos", "magia"],
      },
      {
        id: "pin-costa-tormentas",
        title: "Costa das Tormentas",
        category: "landmark",
        x: 1850,
        y: 1250,
        description: "Falésias açoitadas por tempestades mágicas perpétuas e refúgio de piratas.",
        pageId: "loc-costa",
        color: "#60a5fa",
        tags: ["costa", "porto", "piratas"],
      },
      {
        id: "pin-tumba-secreta",
        title: "Masmorras da Tumba Esquecida",
        category: "secret",
        x: 1200,
        y: 1100,
        description: "Complexo subterrâneo selado onde o Culto do Vazio realiza rituais arcanos.",
        pageId: "loc-2",
        nestedMapId: "map-tumba-dungeon",
        color: "#f43f5e",
        tags: ["masmorra", "culto", "segredo-dm"],
        isSecret: true,
      },
    ],
  },
  {
    id: "map-valefundo-city",
    title: "Capital Valefundo - Mapa Urbano",
    subtitle: "Distritos, Guildas e Castelo Real",
    category: "region",
    parentMapId: "map-eldoria-world",
    width: 2000,
    height: 1400,
    backgroundSvgTheme: "city",
    pins: [
      {
        id: "pin-castelo",
        title: "Cidadela da Coroa",
        category: "capital",
        x: 1000,
        y: 500,
        description: "Sede do Conselho Real e câmara das audiências nobres.",
        pageId: "loc-castelo",
        color: "#fbbf24",
        tags: ["nobreza", "governo"],
      },
      {
        id: "pin-taverna",
        title: "Taverna do Javali Saltitante",
        category: "tavern",
        x: 750,
        y: 850,
        description: "Ponto de encontro dos aventureiros e local de recrutamento para missões.",
        pageId: "loc-sub-1",
        color: "#34d399",
        tags: ["taverna", "encontros"],
      },
      {
        id: "pin-torre-arcana",
        title: "Torre Arcana das Brumas",
        category: "secret",
        x: 1450,
        y: 720,
        description: "Santuário dos magos de batalha. Contém relíquias ocultas e laboratórios planares.",
        pageId: "loc-sub-2",
        color: "#c084fc",
        tags: ["magia", "segredo-dm"],
        isSecret: true,
      },
      {
        id: "pin-mercado-baixo",
        title: "Mercado dos Ferreiros",
        category: "city",
        x: 600,
        y: 1050,
        description: "Onde o aço e as armas de Mithral de Valefundo são forjados e negociados.",
        pageId: "loc-mercado",
        color: "#38bdf8",
        tags: ["comercio", "itens"],
      },
    ],
  },
  {
    id: "map-tumba-dungeon",
    title: "Masmorras da Tumba Esquecida",
    subtitle: "Nível 1 - Cripta dos Condenados",
    category: "dungeon",
    parentMapId: "map-eldoria-world",
    width: 1800,
    height: 1200,
    backgroundSvgTheme: "dungeon",
    pins: [
      {
        id: "pin-entrada-cripta",
        title: "Entrada do Mausoléu",
        category: "landmark",
        x: 300,
        y: 600,
        description: "Degraus desgastados que descem para a escuridão úmida.",
        color: "#94a3b8",
        tags: ["acesso", "perigo"],
      },
      {
        id: "pin-sala-sarcofago",
        title: "Câmara do Sarcófago Negro",
        category: "secret",
        x: 1100,
        y: 550,
        description: "Câmara guardada por esqueletos armadurados e armadilhas de glifo de fogo.",
        color: "#f43f5e",
        tags: ["combate", "tesouro", "segredo-dm"],
        isSecret: true,
      },
      {
        id: "pin-altar-vazio",
        title: "Altar do Culto do Vazio",
        category: "secret",
        x: 1500,
        y: 600,
        description: "Local onde Lady Vespera e seus acólitos realizam o ritual de despertar.",
        color: "#e11d48",
        tags: ["boss", "ritual", "segredo-dm"],
        isSecret: true,
      },
    ],
  },
];
