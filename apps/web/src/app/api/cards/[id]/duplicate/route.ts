import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const sourceCard = await prisma.card.findUnique({
      where: { id },
      include: { world: true },
    });

    if (!sourceCard) {
      return NextResponse.json({ error: "Card não encontrado" }, { status: 404 });
    }

    const isOwner = sourceCard.ownerId === currentUser.id || sourceCard.world.ownerId === currentUser.id;
    if (!isOwner) {
      return NextResponse.json({ error: "Sem permissão para duplicar" }, { status: 403 });
    }

    const newTitle = `${sourceCard.title} (Cópia)`;
    const baseSlug = newTitle
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const newCard = await prisma.card.create({
      data: {
        worldId: sourceCard.worldId,
        ownerId: currentUser.id,
        title: newTitle,
        slug,
        category: sourceCard.category,
        contentMarkdown: sourceCard.contentMarkdown,
        contentJson: sourceCard.contentJson,
        tags: sourceCard.tags,
        properties: sourceCard.properties,
        isSecret: sourceCard.isSecret,
      },
    });

    return NextResponse.json({ success: true, card: newCard }, { status: 201 });
  } catch (error) {
    console.error("Erro ao duplicar card:", error);
    return NextResponse.json({ error: "Erro ao duplicar card" }, { status: 500 });
  }
}
