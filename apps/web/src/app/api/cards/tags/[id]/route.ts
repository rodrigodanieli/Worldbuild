import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const tag = await prisma.cardTag.findUnique({
      where: { id },
      include: { world: { include: { shares: true } } },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag não encontrada" }, { status: 404 });
    }

    const isOwner = tag.world.ownerId === currentUser.id;
    const isEditor = tag.world.shares.some(
      (s) => (s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id) && s.role !== "viewer"
    );

    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: "Sem permissão para editar tags" }, { status: 403 });
    }

    const body = await request.json();
    const { name, color, templateFields, defaultBanner, defaultAvatar } = body;

    const updateData: Record<string, any> = {};
    if (typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }
    if (typeof color === "string" && color.trim()) {
      updateData.color = color.trim();
    }
    if (templateFields !== undefined) {
      updateData.templateFields = typeof templateFields === "string" ? templateFields : JSON.stringify(templateFields);
    }
    if (defaultBanner !== undefined) {
      updateData.defaultBanner = defaultBanner;
    }
    if (defaultAvatar !== undefined) {
      updateData.defaultAvatar = defaultAvatar;
    }

    const updatedTag = await prisma.cardTag.update({
      where: { id },
      data: updateData,
    });

    // Se o nome da tag mudou, atualiza a propriedade category dos cards vinculados
    if (updateData.name && updateData.name !== tag.name) {
      await prisma.card.updateMany({
        where: { tagId: id },
        data: { category: updateData.name },
      });
    }

    return NextResponse.json({ success: true, tag: updatedTag });
  } catch (error) {
    console.error("Erro ao atualizar tag:", error);
    return NextResponse.json({ error: "Erro ao atualizar tag" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const tag = await prisma.cardTag.findUnique({
      where: { id },
      include: { world: { include: { shares: true } } },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag não encontrada" }, { status: 404 });
    }

    const isOwner = tag.world.ownerId === currentUser.id;
    const isEditor = tag.world.shares.some(
      (s) => (s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id) && s.role !== "viewer"
    );

    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: "Sem permissão para remover tags" }, { status: 403 });
    }

    // Desvincula dos cards antes de remover
    await prisma.card.updateMany({
      where: { tagId: id },
      data: { tagId: null },
    });

    await prisma.cardTag.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover tag:", error);
    return NextResponse.json({ error: "Falha ao remover tag" }, { status: 500 });
  }
}
