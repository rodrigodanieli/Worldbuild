import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        world: { include: { shares: true } },
        owner: { select: { id: true, name: true, email: true } },
        assets: true,
        tag: {
          include: {
            templates: true,
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ card });
  } catch (error) {
    console.error("Erro ao carregar card:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const card = await prisma.card.findUnique({
      where: { id },
      include: { world: { include: { shares: true } } },
    });

    if (!card) {
      return NextResponse.json({ error: "Card não encontrado" }, { status: 404 });
    }

    const isOwner = card.ownerId === currentUser.id || card.world.ownerId === currentUser.id;
    const isEditor = card.world.shares.some(
      (s) => (s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id) && s.role !== "viewer"
    );

    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: "Sem permissão de edição" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      contentMarkdown,
      contentJson,
      tags,
      isSecret,
      category,
      tagId,
      coverImage,
      icon,
      properties,
      customFields,
    } = body;

    const updateData: Record<string, any> = {};

    if (typeof title === "string" && title.trim().length > 0) {
      updateData.title = title.trim();
      updateData.slug = title
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
    }

    if (coverImage !== undefined) {
      updateData.coverImage = coverImage;
    }

    if (icon !== undefined) {
      updateData.icon = icon;
    }

    if (properties !== undefined) {
      updateData.properties = typeof properties === "string" ? properties : JSON.stringify(properties);
    }

    if (customFields !== undefined) {
      updateData.customFields = typeof customFields === "string" ? customFields : JSON.stringify(customFields);
    }

    if (typeof contentMarkdown === "string") {
      updateData.contentMarkdown = contentMarkdown;
    }

    if (contentJson !== undefined) {
      updateData.contentJson = typeof contentJson === "string" ? contentJson : JSON.stringify(contentJson);
    }

    if (Array.isArray(tags)) {
      updateData.tags = JSON.stringify(tags);
    }

    if (typeof isSecret === "boolean") {
      updateData.isSecret = isSecret;
    }

    if (typeof category === "string") {
      updateData.category = category;
    }

    if (tagId !== undefined) {
      if (!tagId || typeof tagId !== "string" || tagId.trim() === "" || tagId === "none") {
        updateData.tagId = null;
      } else {
        const tagExists = await prisma.cardTag.findUnique({ where: { id: tagId } });
        updateData.tagId = tagExists ? tagId : null;
      }
    }

    const updatedCard = await prisma.card.update({
      where: { id },
      data: updateData,
      include: {
        tag: {
          include: {
            templates: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      card: updatedCard,
      updatedAt: updatedCard.updatedAt,
    });
  } catch (error) {
    console.error("Erro no auto-save do card:", error);
    return NextResponse.json({ error: "Falha ao salvar card" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const card = await prisma.card.findUnique({
      where: { id },
      include: { world: true },
    });

    if (!card) {
      return NextResponse.json({ error: "Card não encontrado" }, { status: 404 });
    }

    const isOwner = card.ownerId === currentUser.id || card.world.ownerId === currentUser.id;
    if (!isOwner) {
      return NextResponse.json({ error: "Apenas o dono pode remover cards" }, { status: 403 });
    }

    await prisma.card.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir card:", error);
    return NextResponse.json({ error: "Erro ao excluir card" }, { status: 500 });
  }
}
