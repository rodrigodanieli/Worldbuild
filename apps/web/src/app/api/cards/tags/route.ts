import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";

const DEFAULT_CARD_TAGS = [
  { name: "Personagem / NPC", color: "#f59e0b" },
  { name: "Monstro / Criatura", color: "#f43f5e" },
  { name: "Localidade", color: "#10b981" },
  { name: "Item Mágico", color: "#38bdf8" },
  { name: "Facção / Clã", color: "#a855f7" },
  { name: "Missão / Quest", color: "#ec4899" },
  { name: "Anotação Geral", color: "#94a3b8" },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const worldId = searchParams.get("worldId");

    if (!worldId) {
      return NextResponse.json({ error: "worldId é obrigatório" }, { status: 400 });
    }

    let tags = await prisma.cardTag.findMany({
      where: { worldId },
      include: {
        templates: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Se o projeto ainda não tiver tags customizadas, inicializa os padrões no banco SQLite
    if (tags.length === 0) {
      for (const def of DEFAULT_CARD_TAGS) {
        await prisma.cardTag.create({
          data: {
            worldId,
            name: def.name,
            color: def.color,
          },
        }).catch(() => {});
      }

      tags = await prisma.cardTag.findMany({
        where: { worldId },
        include: {
          templates: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Erro ao listar tags de cards:", error);
    return NextResponse.json({ error: "Erro ao buscar tags no banco" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { worldId, name, color, templateFields, defaultBanner, defaultAvatar } = body;

    if (!worldId || !name || !name.trim()) {
      return NextResponse.json(
        { error: "Mundo (worldId) e Nome da Tag são obrigatórios" },
        { status: 400 }
      );
    }

    const world = await prisma.world.findUnique({
      where: { id: worldId },
      include: { shares: true },
    });

    if (!world) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }

    const isOwner = world.ownerId === currentUser.id;
    const isEditor = world.shares.some(
      (s) => (s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id) && s.role !== "viewer"
    );

    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: "Sem permissão para adicionar tags neste projeto" }, { status: 403 });
    }

    const cleanName = name.trim();
    const cleanColor = color && color.trim() ? color.trim() : "#38bdf8";

    // Cria tag customizada no SQLite
    const tag = await prisma.cardTag.upsert({
      where: {
        worldId_name: {
          worldId,
          name: cleanName,
        },
      },
      create: {
        worldId,
        name: cleanName,
        color: cleanColor,
        templateFields: templateFields ? (typeof templateFields === "string" ? templateFields : JSON.stringify(templateFields)) : "[]",
        defaultBanner: defaultBanner || null,
        defaultAvatar: defaultAvatar || null,
      },
      update: {
        color: cleanColor,
        ...(templateFields !== undefined && {
          templateFields: typeof templateFields === "string" ? templateFields : JSON.stringify(templateFields),
        }),
        ...(defaultBanner !== undefined && { defaultBanner }),
        ...(defaultAvatar !== undefined && { defaultAvatar }),
      },
    });

    return NextResponse.json({ success: true, tag }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar tag:", error);
    return NextResponse.json({ error: "Erro ao criar tag de card" }, { status: 500 });
  }
}
