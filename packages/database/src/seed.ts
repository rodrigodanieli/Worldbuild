import { prisma, hashPassword } from "./index";

async function main() {
  console.log("🌱 Populando banco SQLite com Autenticação, Usuários e Compartilhamento...");

  // Limpa tabelas na ordem de dependência
  await prisma.pageShare.deleteMany();
  await prisma.worldShare.deleteMany();
  await prisma.mapPin.deleteMany();
  await prisma.worldMap.deleteMany();
  await prisma.pageRelation.deleteMany();
  await prisma.dndCharacterSheet.deleteMany();
  await prisma.page.deleteMany();
  await prisma.template.deleteMany();
  await prisma.world.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();

  // 1. Criação dos Usuários do Sistema
  const mestre = await prisma.user.create({
    data: {
      id: "usr-mestre-01",
      email: "mestre@worldbuild.com",
      passwordHash: hashPassword("mestre123"),
      name: "Mestre dos Magos",
      settings: {
        create: {
          settings: JSON.stringify({
            theme: "dark",
            showDmSecrets: true,
            editorFontSize: "normal",
            defaultCalendar: "harptos",
          }),
        },
      },
    },
    include: { settings: true },
  });

  const jogador = await prisma.user.create({
    data: {
      id: "usr-jogador-01",
      email: "jogador@rpg.com",
      passwordHash: hashPassword("jogador123"),
      name: "Arthur Pendelton (Jogador)",
      settings: {
        create: {
          settings: JSON.stringify({
            theme: "dark",
            showDmSecrets: false,
            editorFontSize: "normal",
          }),
        },
      },
    },
    include: { settings: true },
  });

  console.log(`✅ Usuários criados:`);
  console.log(`   - Mestre: ${mestre.email} (Senha: mestre123)`);
  console.log(`   - Jogador: ${jogador.email} (Senha: jogador123)`);

  // 2. Criação do Mundo Principal do Mestre
  const world = await prisma.world.create({
    data: {
      id: "world-eldoria-01",
      ownerId: mestre.id,
      name: "Reino de Eldoria",
      slug: "reino-de-eldoria",
      description: "Um vasto império de fantasia medieval governado pelo Conselho das Quatro Coroas.",
      coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
      shareToken: "world-share-eldoria-token",
      isPublic: false,
    },
  });

  const world2 = await prisma.world.create({
    data: {
      id: "world-mar-02",
      ownerId: mestre.id,
      name: "Arquipélago do Mar Sombrio",
      slug: "arquipelago-mar-sombrio",
      description: "Campanha pirata e ilhas inexploradas com criaturas do abismo.",
      coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      isPublic: false,
    },
  });

  // Compartilha o projeto de Eldoria com o Jogador
  await prisma.worldShare.create({
    data: {
      worldId: world.id,
      sharedWithEmail: jogador.email,
      sharedWithUserId: jogador.id,
      role: "player",
    },
  });

  // 3. Templates com Campos Estruturados
  const templateDnd = await prisma.template.create({
    data: {
      id: "tpl-dnd-5e-character",
      worldId: world.id,
      name: "Personagem de D&D 5ª Edição",
      description: "Ficha viva compatível com D&D 5e e sincronizada com app mobile.",
      category: "dnd-character-5e",
      icon: "user-check",
      defaultTags: JSON.stringify(["personagem", "dnd-5e"]),
      schemaFields: JSON.stringify([
        { id: "dnd_name", name: "Nome", type: "text", required: true },
        { id: "dnd_class", name: "Classe", type: "page-relation", required: true },
        { id: "dnd_level", name: "Nível", type: "number", required: true, defaultValue: 1 },
        { id: "dnd_attributes", name: "Atributos", type: "dnd-attributes", required: true },
      ]),
      defaultContent: "## História e Personalidade\n\nDescreva a trajetória do herói.",
    },
  });

  const templateLocation = await prisma.template.create({
    data: {
      id: "tpl-location",
      worldId: world.id,
      name: "Lugar / Região / Cidade",
      description: "Template para assentamentos, reinos e masmorras.",
      category: "location",
      icon: "compass",
      defaultTags: JSON.stringify(["lugar"]),
      schemaFields: JSON.stringify([
        { id: "loc_type", name: "Tipo", type: "select", options: ["Cidade", "Masmorra", "Reino"] },
      ]),
      defaultContent: "## Visão Geral\n\nDescreva a atmosfera e governo deste local.",
    },
  });

  // 4. Páginas da Wiki
  const pageValefundo = await prisma.page.create({
    data: {
      id: "page-valefundo",
      worldId: world.id,
      ownerId: mestre.id,
      title: "Capital Valefundo",
      slug: "capital-valefundo",
      templateId: templateLocation.id,
      shareToken: "share-valefundo-token", // Token para link único
      tags: JSON.stringify(["capital", "cidade", "comercio"]),
      contentMarkdown: "Grande cidadela protegida por muralhas de pedra e forjas de anões.",
      isSecret: false,
    },
  });

  const pageTumba = await prisma.page.create({
    data: {
      id: "page-tumba",
      worldId: world.id,
      ownerId: mestre.id,
      title: "Masmorras da Tumba Esquecida",
      slug: "tumba-esquecida",
      parentId: pageValefundo.id,
      tags: JSON.stringify(["masmorra", "segredo-dm", "mortos-vivos"]),
      contentMarkdown: ":::secret\nEntrada secreta sob a taverna conectando ao Culto do Vazio.\n:::",
      isSecret: true,
    },
  });

  const pageKaelen = await prisma.page.create({
    data: {
      id: "page-kaelen",
      worldId: world.id,
      ownerId: mestre.id,
      title: "Kaelen Sombra-da-Noite",
      slug: "kaelen-sombra-da-noite",
      templateId: templateDnd.id,
      shareToken: "share-kaelen-sheet-token",
      tags: JSON.stringify(["personagem", "jogador", "dnd-5e"]),
      contentMarkdown: "Guerreiro Mestre de Batalha treinado nos quartéis de Valefundo.",
      isSecret: false,
    },
  });

  // 5. Ficha Viva de D&D
  await prisma.dndCharacterSheet.create({
    data: {
      pageId: pageKaelen.id,
      characterName: "Kaelen Sombra-da-Noite",
      level: 3,
      hpMax: 28,
      hpCurrent: 24,
      attributes: JSON.stringify({
        for: 16,
        des: 14,
        con: 15,
        int: 10,
        sab: 12,
        car: 8,
      }),
      spellSlots: JSON.stringify({}),
      inventory: JSON.stringify(["Espada Longa de Mithral", "Escudo dos Guardiões"]),
    },
  });

  // 6. Compartilhamento por E-mail (Concedendo acesso de leitura ao Jogador)
  await prisma.pageShare.create({
    data: {
      pageId: pageValefundo.id,
      sharedWithEmail: jogador.email,
      sharedWithUserId: jogador.id,
      role: "viewer", // Acesso de visualização
    },
  });

  await prisma.pageShare.create({
    data: {
      pageId: pageKaelen.id,
      sharedWithEmail: jogador.email,
      sharedWithUserId: jogador.id,
      role: "viewer",
    },
  });

  // 7. Relações no Grafo
  await prisma.pageRelation.create({
    data: {
      worldId: world.id,
      sourcePageId: pageTumba.id,
      targetPageId: pageValefundo.id,
      relationType: "parent-child",
      label: "Sob o solo de",
    },
  });

  // 8. Mapa do Mundo e Pinos
  const worldMap = await prisma.worldMap.create({
    data: {
      id: "map-eldoria",
      worldId: world.id,
      title: "Continente de Eldoria",
      category: "world",
      width: 2400,
      height: 1600,
      backgroundSvgTheme: "world",
    },
  });

  await prisma.mapPin.createMany({
    data: [
      {
        mapId: worldMap.id,
        x: 950,
        y: 820,
        title: "Capital Valefundo",
        category: "capital",
        color: "#38bdf8",
        pageId: pageValefundo.id,
        tags: JSON.stringify(["capital", "cidade"]),
        isSecret: false,
      },
      {
        mapId: worldMap.id,
        x: 1200,
        y: 1100,
        title: "Masmorras da Tumba Esquecida",
        category: "dungeon",
        color: "#f43f5e",
        pageId: pageTumba.id,
        tags: JSON.stringify(["masmorra", "segredo-dm"]),
        isSecret: true,
      },
    ],
  });

  console.log("✨ Seed completo executado com sucesso no SQLite!");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
