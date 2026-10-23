# WorldBuild Hub

Plataforma de criação de mundos (*worldbuilding*), wiki colaborativa com mapas infinitos (Deep Zoom), visão de mapas mentais/grafo de conhecimento e aplicativo móvel sincronizado para fichas de RPG de D&D.

Inspirado nas funcionalidades do **LegendKeeper**, com foco expandido para automação e suporte a campanhas de RPG de mesa.

---

## 🏗️ Estrutura do Monorepo

Este projeto utiliza **Turborepo** + **pnpm Workspaces**:

- **`apps/web`**: Aplicação Web e PWA (Next.js 15, React 19, Tailwind CSS, TipTap, Leaflet, React Flow).
- **`apps/mobile`**: Aplicativo móvel para Android (Google Play) desenvolvido em React Native Expo focado na ficha viva de personagem e sincronização com a campanha.
- **`apps/server`**: Servidor em tempo real baseado em Fastify + WebSockets + Yjs (salas de colaboração CRDT).
- **`packages/core`**: Modelagem de dados, Schemas Zod de Páginas, Templates Customizáveis, Filtros de Relação e Pinos de Mapa.
- **`packages/dnd-rules`**: Motores de cálculo de D&D (modificadores, bônus de proficiência, CD de magias).
- **`packages/editor-engine`**: Contratos do editor de texto rico (comandos de barra `/`, menções `@` de páginas, blocos secretos de DM).
- **`packages/tsconfig`**: Configurações compartilhadas do TypeScript.

---

## 🚀 Comandos Rápidos

```bash
# Instalar dependências em todos os pacotes
pnpm install

# Iniciar todos os apps em modo desenvolvimento (Web + Server + Mobile)
pnpm dev

# Iniciar apenas o aplicativo Web
pnpm --filter @worldbuild/web dev

# Iniciar apenas o servidor backend
pnpm --filter @worldbuild/server dev

# Iniciar o aplicativo Mobile (Expo)
pnpm --filter @worldbuild/mobile start
```

---

## 🐳 Executando com Docker (1-Clique / Play)

Você pode subir toda a aplicação Web em container Docker de produção:

### Pelo Terminal:
```bash
docker compose up -d
```

### Pelo Docker Desktop:
Basta clicar em **Play** no container `worldbuild-app` (ou stack `worldbuild`).

- **URL no Navegador:** [http://localhost:3000](http://localhost:3000)
- **Persistência de Dados:** O banco SQLite (`packages/database/prisma/dev.db`) e os uploads de mídia (`apps/web/public/uploads`) estão mapeados em volumes locais.
- **Contas de Teste Pré-configuradas:**
  - **Mestre:** `mestre@worldbuild.com` / `mestre123`
  - **Jogador:** `jogador@rpg.com` / `jogador123`
