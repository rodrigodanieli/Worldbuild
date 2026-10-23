import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const worldId = searchParams.get("worldId");
    const isDm = searchParams.get("dm") === "true";

    if (!worldId) {
      return NextResponse.json({ error: "worldId é obrigatório" }, { status: 400 });
    }

    const cards = await prisma.card.findMany({
      where: {
        worldId,
      },
      include: {
        tag: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Erro ao listar cards:", error);
    return NextResponse.json({ error: "Erro ao consultar cards no banco" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      worldId,
      title,
      category,
      tagId,
      contentMarkdown,
      isSecret,
      tags,
      coverImage,
      icon,
      customFields,
      properties,
    } = body;

    if (!worldId || !title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Mundo (worldId) e Título são obrigatórios" }, { status: 400 });
    }

    const world = await prisma.world.findUnique({
      where: { id: worldId },
      include: { shares: true },
    });

    if (!world) {
      return NextResponse.json({ error: "Projeto de mundo não encontrado" }, { status: 404 });
    }

    const isOwner = world.ownerId === currentUser.id;
    const isEditor = world.shares.some(
      (s) => (s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id) && s.role !== "viewer"
    );

    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: "Sem permissão para criar cards neste projeto" }, { status: 403 });
    }

    const cleanTitle = title.trim();
    const baseSlug = cleanTitle
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-") || "card";
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const initialContent = contentMarkdown || `<h1>${cleanTitle}</h1><p>Registro do card de ${category || "campanha"}. Digite <code>/</code> para blocos ou <code>@</code> para vincular referências.</p>`;

    const newCard = await prisma.card.create({
      data: {
        worldId,
        ownerId: currentUser.id,
        title: cleanTitle,
        slug,
        category: category || "Item / Registro",
        tagId: tagId || null,
        coverImage: coverImage || null,
        icon: icon || null,
        customFields:
          typeof customFields === "string"
            ? customFields
            : JSON.stringify(customFields || []),
        properties:
          typeof properties === "string"
            ? properties
            : JSON.stringify(properties || {}),
        contentMarkdown: initialContent,
        contentJson: "{}",
        isSecret: !!isSecret,
        tags: JSON.stringify(tags || []),
      },
      include: {
        tag: true,
      },
    });

    return NextResponse.json({ success: true, card: newCard }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar card no banco SQLite:", error);
    return NextResponse.json({ error: "Erro ao criar card" }, { status: 500 });
  }
}
