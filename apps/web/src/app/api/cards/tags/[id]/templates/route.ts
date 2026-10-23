import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: tagId } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const templates = await prisma.cardTagTemplate.findMany({
      where: { tagId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Erro ao listar templates da tag:", error);
    return NextResponse.json({ error: "Erro ao buscar templates" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: tagId } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const tag = await prisma.cardTag.findUnique({
      where: { id: tagId },
      include: { world: { include: { shares: true } } },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag não encontrada" }, { status: 404 });
    }

    const isOwner = tag.world.ownerId === currentUser.id;
    const isEditor = tag.world.shares.some(
      (s) =>
        (s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id) &&
        s.role !== "viewer"
    );

    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: "Sem permissão para adicionar templates" }, { status: 403 });
    }

    const body = await request.json();
    const { name, fields, defaultBanner, defaultAvatar } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nome do template é obrigatório" }, { status: 400 });
    }

    const fieldsString =
      typeof fields === "string" ? fields : JSON.stringify(fields || []);

    const newTemplate = await prisma.cardTagTemplate.create({
      data: {
        tagId,
        name: name.trim(),
        fields: fieldsString,
        defaultBanner: defaultBanner || null,
        defaultAvatar: defaultAvatar || null,
      },
    });

    return NextResponse.json({ success: true, template: newTemplate }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar template de tag:", error);
    return NextResponse.json({ error: "Erro ao criar template" }, { status: 500 });
  }
}
