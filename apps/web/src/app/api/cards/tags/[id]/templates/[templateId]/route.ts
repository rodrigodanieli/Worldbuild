import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string; templateId: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: tagId, templateId } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const template = await prisma.cardTagTemplate.findUnique({
      where: { id: templateId },
      include: { tag: { include: { world: { include: { shares: true } } } } },
    });

    if (!template) {
      return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
    }

    const isOwner = template.tag.world.ownerId === currentUser.id;
    const isEditor = template.tag.world.shares.some(
      (s) =>
        (s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id) &&
        s.role !== "viewer"
    );

    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: "Sem permissão para excluir template" }, { status: 403 });
    }

    await prisma.cardTagTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir template:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id: tagId, templateId } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const template = await prisma.cardTagTemplate.findUnique({
      where: { id: templateId },
      include: { tag: { include: { world: { include: { shares: true } } } } },
    });

    if (!template) {
      return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
    }

    const isOwner = template.tag.world.ownerId === currentUser.id;
    const isEditor = template.tag.world.shares.some(
      (s) =>
        (s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id) &&
        s.role !== "viewer"
    );

    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: "Sem permissão para atualizar template" }, { status: 403 });
    }

    const body = await request.json();
    const { name, fields, defaultBanner, defaultAvatar } = body;

    const data: Record<string, any> = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (fields !== undefined) {
      data.fields = typeof fields === "string" ? fields : JSON.stringify(fields);
    }
    if (defaultBanner !== undefined) data.defaultBanner = defaultBanner;
    if (defaultAvatar !== undefined) data.defaultAvatar = defaultAvatar;

    const updated = await prisma.cardTagTemplate.update({
      where: { id: templateId },
      data,
    });

    return NextResponse.json({ success: true, template: updated });
  } catch (error) {
    console.error("Erro ao atualizar template:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
