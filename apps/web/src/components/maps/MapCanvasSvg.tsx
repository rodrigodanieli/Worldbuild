import React from "react";

export interface MapCanvasSvgProps {
  theme: "world" | "city" | "dungeon";
  width: number;
  height: number;
}

export function MapCanvasSvg({ theme, width, height }: MapCanvasSvgProps) {
  if (theme === "city") {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="cityGround" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#1e2330" />
            <stop offset="100%" stopColor="#0f1118" />
          </radialGradient>
          <pattern id="streetGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#252c3d" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Fundo Urbano */}
        <rect width={width} height={height} fill="url(#cityGround)" />
        <rect width={width} height={height} fill="url(#streetGrid)" opacity="0.6" />

        {/* Rio que corta a cidade */}
        <path
          d="M 0 400 Q 500 600, 1000 800 T 2000 1100"
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="120"
          strokeLinecap="round"
        />
        <path
          d="M 0 400 Q 500 600, 1000 800 T 2000 1100"
          fill="none"
          stroke="#2563eb"
          strokeWidth="30"
          opacity="0.3"
        />

        {/* Pontes sobre o rio */}
        <rect x="700" y="660" width="40" height="90" fill="#475569" rx="4" transform="rotate(-30 720 705)" />
        <rect x="1350" y="900" width="40" height="90" fill="#475569" rx="4" transform="rotate(-20 1370 945)" />

        {/* Muralha externa da cidade */}
        <rect
          x="150"
          y="150"
          width={width - 300}
          height={height - 300}
          rx="120"
          fill="none"
          stroke="#334155"
          strokeWidth="35"
        />
        <rect
          x="150"
          y="150"
          width={width - 300}
          height={height - 300}
          rx="120"
          fill="none"
          stroke="#475569"
          strokeWidth="8"
          strokeDasharray="20 15"
        />

        {/* Bastiões da muralha */}
        <circle cx="150" cy="150" r="45" fill="#475569" stroke="#64748b" strokeWidth="6" />
        <circle cx={width - 150} cy="150" r="45" fill="#475569" stroke="#64748b" strokeWidth="6" />
        <circle cx="150" cy={height - 150} r="45" fill="#475569" stroke="#64748b" strokeWidth="6" />
        <circle cx={width - 150} cy={height - 150} r="45" fill="#475569" stroke="#64748b" strokeWidth="6" />

        {/* Quarteirões de casas (Blocos de Construções) */}
        <g fill="#171b26" stroke="#2c3547" strokeWidth="3">
          <rect x="400" y="300" width="220" height="180" rx="10" />
          <rect x="700" y="280" width="260" height="150" rx="10" />
          <rect x="420" y="800" width="200" height="240" rx="10" />
          <rect x="1100" y="250" width="300" height="220" rx="10" />
          <rect x="1500" y="320" width="240" height="300" rx="10" />
          <rect x="1200" y="650" width="220" height="180" rx="10" />
          <rect x="800" y="1050" width="350" height="180" rx="10" />
        </g>

        {/* Cidadela Real (Centro de Poder) */}
        <circle cx="1000" cy="500" r="140" fill="#1e1829" stroke="#d97706" strokeWidth="6" />
        <circle cx="1000" cy="500" r="70" fill="#2e2040" stroke="#f59e0b" strokeWidth="4" />

        {/* Textos de Identificação */}
        <text x="1000" y="505" fill="#fde68a" fontSize="18" fontWeight="bold" textAnchor="middle" letterSpacing="2">
          CASTELO REAL
        </text>
        <text x="510" y="395" fill="#94a3b8" fontSize="13" fontWeight="bold" textAnchor="middle">
          DISTRITO COMERCIAL
        </text>
      </svg>
    );
  }

  if (theme === "dungeon") {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="dungeonFloor" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="#10121a" />
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a1e2b" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Rocha Sólida Subterrânea */}
        <rect width={width} height={height} fill="#08090d" />

        {/* Salas Escavadas */}
        {/* Sala de Entrada */}
        <rect x="200" y="480" width="300" height="240" fill="url(#dungeonFloor)" stroke="#e11d48" strokeWidth="3" />
        {/* Corredor 1 */}
        <rect x="500" y="560" width="250" height="80" fill="url(#dungeonFloor)" stroke="#64748b" strokeWidth="2" />
        {/* Sala Central do Sarcófago */}
        <rect x="750" y="380" width="450" height="420" fill="url(#dungeonFloor)" stroke="#f43f5e" strokeWidth="4" />
        {/* Pilares da Sala Central */}
        <rect x="850" y="450" width="30" height="30" fill="#475569" stroke="#94a3b8" />
        <rect x="1100" y="450" width="30" height="30" fill="#475569" stroke="#94a3b8" />
        <rect x="850" y="680" width="30" height="30" fill="#475569" stroke="#94a3b8" />
        <rect x="1100" y="680" width="30" height="30" fill="#475569" stroke="#94a3b8" />
        {/* Sarcófago Central */}
        <rect x="950" y="540" width="80" height="120" rx="6" fill="#1c1917" stroke="#e11d48" strokeWidth="3" />

        {/* Corredor Secreto */}
        <rect x="1200" y="570" width="200" height="60" fill="url(#dungeonFloor)" stroke="#f43f5e" strokeWidth="2" strokeDasharray="6 4" />
        {/* Câmara do Altar do Vazio */}
        <circle cx="1500" cy="600" r="160" fill="url(#dungeonFloor)" stroke="#be123c" strokeWidth="5" />
        {/* Círculo Mágico de Invocação */}
        <circle cx="1500" cy="600" r="100" fill="none" stroke="#e11d48" strokeWidth="2" strokeDasharray="10 5" opacity="0.8" />
        <circle cx="1500" cy="600" r="50" fill="none" stroke="#f43f5e" strokeWidth="2" opacity="0.6" />

        <text x="350" y="610" fill="#94a3b8" fontSize="14" fontWeight="bold" textAnchor="middle">
          Mausoléu de Entrada
        </text>
        <text x="990" y="605" fill="#fca5a5" fontSize="14" fontWeight="bold" textAnchor="middle">
          Sarcófago Negro
        </text>
        <text x="1500" y="605" fill="#f43f5e" fontSize="15" fontWeight="bold" textAnchor="middle">
          Altar Oculto
        </text>
      </svg>
    );
  }

  // Tema Padrão: Mapa do Continente de Eldoria (World Map)
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#0c1322" />
          <stop offset="100%" stopColor="#060911" />
        </radialGradient>
        <pattern id="seaGrid" width="100" height="100" patternUnits="userSpaceOnUse">
          <circle cx="50" cy="50" r="1" fill="#1e293b" opacity="0.5" />
        </pattern>
      </defs>

      {/* Oceano Abissal de Fundo */}
      <rect width={width} height={height} fill="url(#oceanGrad)" />
      <rect width={width} height={height} fill="url(#seaGrid)" />

      {/* Massa Continental Principal (Costa e Território de Eldoria) */}
      <path
        d="M 350 250 
           Q 600 150, 1100 200 
           T 1800 280 
           Q 2200 450, 2050 850 
           T 1900 1350 
           Q 1500 1550, 1000 1450 
           T 400 1200 
           Q 150 900, 250 550 
           Z"
        fill="#121824"
        stroke="#1e3a5f"
        strokeWidth="16"
      />
      <path
        d="M 350 250 
           Q 600 150, 1100 200 
           T 1800 280 
           Q 2200 450, 2050 850 
           T 1900 1350 
           Q 1500 1550, 1000 1450 
           T 400 1200 
           Q 150 900, 250 550 
           Z"
        fill="#141a29"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeOpacity="0.4"
      />

      {/* Cordilheira de Montanhas Cinzentas (Picos desenhados) */}
      <g fill="#1e293b" stroke="#475569" strokeWidth="3">
        <polygon points="500,500 580,360 660,500" />
        <polygon points="620,520 700,340 780,520" />
        <polygon points="740,510 820,380 900,510" />
        <polygon points="860,530 940,350 1020,530" />
        <polygon points="580,600 650,470 720,600" />
        <polygon points="680,610 750,490 820,610" />
      </g>

      {/* Floresta dos Sussurros (Mancha verdejante com detalhes de copas) */}
      <path
        d="M 1450 500 Q 1700 400, 1850 600 T 1750 900 Q 1500 950, 1400 750 Z"
        fill="#0f291e"
        stroke="#10b981"
        strokeWidth="3"
        strokeOpacity="0.4"
      />
      <circle cx="1550" cy="620" r="35" fill="#134e4a" />
      <circle cx="1650" cy="580" r="45" fill="#134e4a" />
      <circle cx="1700" cy="680" r="40" fill="#134e4a" />
      <circle cx="1600" cy="740" r="50" fill="#134e4a" />

      {/* Rios que cortam o continente até o mar */}
      <path
        d="M 850 480 Q 950 650, 950 820 T 1150 1150 Q 1300 1350, 1500 1480"
        fill="none"
        stroke="#1e3a5f"
        strokeWidth="20"
        strokeLinecap="round"
      />
      <path
        d="M 850 480 Q 950 650, 950 820 T 1150 1150 Q 1300 1350, 1500 1480"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="4"
        strokeOpacity="0.5"
      />

      {/* Estradas principais conectando as regiões */}
      <path
        d="M 950 820 Q 1300 750, 1650 650"
        fill="none"
        stroke="#b45309"
        strokeWidth="4"
        strokeDasharray="12 8"
        strokeOpacity="0.7"
      />
      <path
        d="M 950 820 Q 1400 1000, 1850 1250"
        fill="none"
        stroke="#b45309"
        strokeWidth="4"
        strokeDasharray="12 8"
        strokeOpacity="0.7"
      />

      {/* Rosa dos Ventos Ornamental */}
      <g transform="translate(2100, 220)">
        <circle cx="0" cy="0" r="90" fill="#111827" stroke="#374151" strokeWidth="3" />
        <polygon points="0,-80 15,-15 80,0 15,15 0,80 -15,15 -80,0 -15,-15" fill="#f59e0b" />
        <polygon points="0,-80 0,0 80,0 0,0 0,80 0,0 -80,0 0,0" fill="#d97706" />
        <text x="0" y="-88" fill="#fde68a" fontSize="16" fontWeight="bold" textAnchor="middle">N</text>
        <text x="96" y="6" fill="#94a3b8" fontSize="14" fontWeight="bold" textAnchor="middle">L</text>
        <text x="0" y="104" fill="#94a3b8" fontSize="14" fontWeight="bold" textAnchor="middle">S</text>
        <text x="-96" y="6" fill="#94a3b8" fontSize="14" fontWeight="bold" textAnchor="middle">O</text>
      </g>

      {/* Legenda de Cartografia no Canto Inferior Esquerdo */}
      <g transform="translate(100, 1400)">
        <rect width="280" height="90" rx="10" fill="#111827" stroke="#1f293d" strokeWidth="2" opacity="0.9" />
        <text x="20" y="32" fill="#f3f4f6" fontSize="15" fontWeight="bold" letterSpacing="1">
          ELDORIA CONTINENTAL
        </text>
        <text x="20" y="55" fill="#94a3b8" fontSize="11">
          Escala: 1 hex = 30 milhas
        </text>
        <text x="20" y="73" fill="#38bdf8" fontSize="10">
          Projeção Plenar Cartográfica
        </text>
      </g>
    </svg>
  );
}
