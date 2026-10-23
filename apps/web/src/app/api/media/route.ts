import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const resource = searchParams.get("resource");
    const mediaType = searchParams.get("mediaType");

    if (!projectId) {
      return NextResponse.json({ error: "projectId é obrigatório" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const whereClause: Record<string, any> = { projectId };
    if (resource) {
      whereClause.resource = resource;
    }
    if (mediaType) {
      whereClause.mediaType = mediaType;
    }

    const media = await prisma.projectMedia.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ media });
  } catch (error) {
    console.error("Erro ao listar mídias do projeto:", error);
    return NextResponse.json({ error: "Erro ao buscar mídias" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID da mídia é obrigatório" }, { status: 400 });
    }

    const media = await prisma.projectMedia.findUnique({
      where: { id },
      include: { project: { include: { shares: true } } },
    });

    if (!media) {
      return NextResponse.json({ error: "Mídia não encontrada" }, { status: 404 });
    }

    const isOwner = media.project.ownerId === currentUser.id;
    const isEditor = media.project.shares.some(
      (s) =>
        (s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id) &&
        s.role !== "viewer"
    );

    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: "Sem permissão para excluir esta mídia" }, { status: 403 });
    }

    // Remove do banco de dados
    await prisma.projectMedia.delete({
      where: { id },
    });

    // Tenta remover o arquivo físico se não houver outras referências
    try {
      const remaining = await prisma.projectMedia.count({
        where: { filename: media.filename },
      });
      if (remaining === 0) {
        const filePath = path.join(process.cwd(), "public", "uploads", media.filename);
        await fs.unlink(filePath).catch(() => {});
      }
    } catch (e) {
      // Ignora erro de exclusão de arquivo físico
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir mídia:", error);
    return NextResponse.json({ error: "Erro ao excluir mídia" }, { status: 500 });
  }
}
