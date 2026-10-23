export function generateMapSvgString(theme: "world" | "city" | "dungeon", width: number, height: number): string {
  if (theme === "city") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <radialGradient id="cityGround" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stop-color="#1e2330" />
            <stop offset="100%" stop-color="#0f1118" />
          </radialGradient>
          <pattern id="streetGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#252c3d" stroke-width="1" />
          </pattern>
        </defs>

        <rect width="${width}" height="${height}" fill="url(#cityGround)" />
        <rect width="${width}" height="${height}" fill="url(#streetGrid)" opacity="0.6" />

        <!-- Rio Principal -->
        <path d="M 0 400 Q 500 600, 1000 800 T 2000 1100" fill="none" stroke="#1e3a5f" stroke-width="140" stroke-linecap="round" />
        <path d="M 0 400 Q 500 600, 1000 800 T 2000 1100" fill="none" stroke="#38bdf8" stroke-width="30" opacity="0.3" />

        <!-- Pontes -->
        <rect x="700" y="660" width="40" height="90" fill="#475569" rx="4" transform="rotate(-30 720 705)" />
        <rect x="1350" y="900" width="40" height="90" fill="#475569" rx="4" transform="rotate(-20 1370 945)" />

        <!-- Grande Muralha -->
        <rect x="150" y="150" width="${width - 300}" height="${height - 300}" rx="120" fill="none" stroke="#334155" stroke-width="35" />
        <rect x="150" y="150" width="${width - 300}" height="${height - 300}" rx="120" fill="none" stroke="#475569" stroke-width="8" stroke-dasharray="20 15" />

        <!-- Bastiões -->
        <circle cx="150" cy="150" r="45" fill="#475569" stroke="#64748b" stroke-width="6" />
        <circle cx="${width - 150}" cy="150" r="45" fill="#475569" stroke="#64748b" stroke-width="6" />
        <circle cx="150" cy="${height - 150}" r="45" fill="#475569" stroke="#64748b" stroke-width="6" />
        <circle cx="${width - 150}" cy="${height - 150}" r="45" fill="#475569" stroke="#64748b" stroke-width="6" />

        <!-- Construções e Distritos -->
        <g fill="#171b26" stroke="#2c3547" stroke-width="3">
          <rect x="400" y="300" width="220" height="180" rx="10" />
          <rect x="700" y="280" width="260" height="150" rx="10" />
          <rect x="420" y="800" width="200" height="240" rx="10" />
          <rect x="1100" y="250" width="300" height="220" rx="10" />
          <rect x="1500" y="320" width="240" height="300" rx="10" />
          <rect x="1200" y="650" width="220" height="180" rx="10" />
          <rect x="800" y="1050" width="350" height="180" rx="10" />
        </g>

        <!-- Castelo Real -->
        <circle cx="1000" cy="500" r="140" fill="#1e1829" stroke="#d97706" stroke-width="6" />
        <circle cx="1000" cy="500" r="70" fill="#2e2040" stroke="#f59e0b" stroke-width="4" />
        <text x="1000" y="505" fill="#fde68a" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="middle">CASTELO REAL</text>
      </svg>
    `;
  }

  if (theme === "dungeon") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <pattern id="dungeonGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="#10121a" />
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a1e2b" stroke-width="1" />
          </pattern>
        </defs>

        <rect width="${width}" height="${height}" fill="#08090d" />

        <!-- Criptas e Corredores -->
        <rect x="200" y="480" width="300" height="240" fill="url(#dungeonGrid)" stroke="#e11d48" stroke-width="3" />
        <rect x="500" y="560" width="250" height="80" fill="url(#dungeonGrid)" stroke="#64748b" stroke-width="2" />
        <rect x="750" y="380" width="450" height="420" fill="url(#dungeonGrid)" stroke="#f43f5e" stroke-width="4" />

        <!-- Pilares -->
        <rect x="850" y="450" width="30" height="30" fill="#475569" stroke="#94a3b8" />
        <rect x="1100" y="450" width="30" height="30" fill="#475569" stroke="#94a3b8" />
        <rect x="850" y="680" width="30" height="30" fill="#475569" stroke="#94a3b8" />
        <rect x="1100" y="680" width="30" height="30" fill="#475569" stroke="#94a3b8" />

        <!-- Sarcófago -->
        <rect x="950" y="540" width="80" height="120" rx="6" fill="#1c1917" stroke="#e11d48" stroke-width="3" />

        <!-- Câmara do Altar -->
        <rect x="1200" y="570" width="200" height="60" fill="url(#dungeonGrid)" stroke="#f43f5e" stroke-width="2" stroke-dasharray="6 4" />
        <circle cx="1500" cy="600" r="160" fill="url(#dungeonGrid)" stroke="#be123c" stroke-width="5" />
        <circle cx="1500" cy="600" r="100" fill="none" stroke="#e11d48" stroke-width="2" stroke-dasharray="10 5" opacity="0.8" />
        <circle cx="1500" cy="600" r="50" fill="none" stroke="#f43f5e" stroke-width="2" opacity="0.6" />

        <text x="350" y="610" fill="#94a3b8" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="middle">Mausoléu de Entrada</text>
        <text x="990" y="605" fill="#fca5a5" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="middle">Sarcófago Negro</text>
        <text x="1500" y="605" fill="#f43f5e" font-size="15" font-family="sans-serif" font-weight="bold" text-anchor="middle">Altar do Culto</text>
      </svg>
    `;
  }

  // Padrão: Mapa Continental de Eldoria
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#0c1322" />
          <stop offset="100%" stop-color="#060911" />
        </radialGradient>
        <pattern id="seaGrid" width="100" height="100" patternUnits="userSpaceOnUse">
          <circle cx="50" cy="50" r="1.5" fill="#1e293b" opacity="0.6" />
        </pattern>
      </defs>

      <!-- Fundo do Oceano -->
      <rect width="${width}" height="${height}" fill="url(#oceanGrad)" />
      <rect width="${width}" height="${height}" fill="url(#seaGrid)" />

      <!-- Massa Continental -->
      <path d="M 350 250 Q 600 150, 1100 200 T 1800 280 Q 2200 450, 2050 850 T 1900 1350 Q 1500 1550, 1000 1450 T 400 1200 Q 150 900, 250 550 Z" fill="#121824" stroke="#1e3a5f" stroke-width="16" />
      <path d="M 350 250 Q 600 150, 1100 200 T 1800 280 Q 2200 450, 2050 850 T 1900 1350 Q 1500 1550, 1000 1450 T 400 1200 Q 150 900, 250 550 Z" fill="#141a29" stroke="#38bdf8" stroke-width="3" stroke-opacity="0.4" />

      <!-- Montanhas Cinzentas -->
      <g fill="#1e293b" stroke="#475569" stroke-width="3">
        <polygon points="500,500 580,360 660,500" />
        <polygon points="620,520 700,340 780,520" />
        <polygon points="740,510 820,380 900,510" />
        <polygon points="860,530 940,350 1020,530" />
        <polygon points="580,600 650,470 720,600" />
        <polygon points="680,610 750,490 820,610" />
      </g>

      <!-- Floresta dos Sussurros -->
      <path d="M 1450 500 Q 1700 400, 1850 600 T 1750 900 Q 1500 950, 1400 750 Z" fill="#0f291e" stroke="#10b981" stroke-width="3" stroke-opacity="0.4" />
      <circle cx="1550" cy="620" r="35" fill="#134e4a" />
      <circle cx="1650" cy="580" r="45" fill="#134e4a" />
      <circle cx="1700" cy="680" r="40" fill="#134e4a" />
      <circle cx="1600" cy="740" r="50" fill="#134e4a" />

      <!-- Rios -->
      <path d="M 850 480 Q 950 650, 950 820 T 1150 1150 Q 1300 1350, 1500 1480" fill="none" stroke="#1e3a5f" stroke-width="20" stroke-linecap="round" />
      <path d="M 850 480 Q 950 650, 950 820 T 1150 1150 Q 1300 1350, 1500 1480" fill="none" stroke="#38bdf8" stroke-width="4" stroke-opacity="0.5" />

      <!-- Estradas -->
      <path d="M 950 820 Q 1300 750, 1650 650" fill="none" stroke="#b45309" stroke-width="4" stroke-dasharray="12 8" stroke-opacity="0.7" />
      <path d="M 950 820 Q 1400 1000, 1850 1250" fill="none" stroke="#b45309" stroke-width="4" stroke-dasharray="12 8" stroke-opacity="0.7" />

      <!-- Rosa dos Ventos -->
      <g transform="translate(2100, 220)">
        <circle cx="0" cy="0" r="90" fill="#111827" stroke="#374151" stroke-width="3" />
        <polygon points="0,-80 15,-15 80,0 15,15 0,80 -15,15 -80,0 -15,-15" fill="#f59e0b" />
        <polygon points="0,-80 0,0 80,0 0,0 0,80 0,0 -80,0 0,0" fill="#d97706" />
        <text x="0" y="-88" fill="#fde68a" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">N</text>
      </g>
    </svg>
  `;
}
