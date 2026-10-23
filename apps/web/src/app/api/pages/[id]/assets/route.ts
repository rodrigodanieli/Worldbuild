import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/pages/[id]/assets - Listar todos os arquivos vinculados à página
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const assets = await prisma.pageAsset.findMany({
      where: { pageId: id },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ assets });
  } catch (error) {
    console.error("Erro ao listar assets da página:", error);
    return NextResponse.json({ error: "Erro ao consultar mídias" }, { status: 500 });
  }
}

// DELETE /api/pages/[id]/assets?assetId=... - Remover arquivo do servidor e do SQLite
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId");

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!assetId) {
      return NextResponse.json({ error: "ID do asset é obrigatório" }, { status: 400 });
    }

    const asset = await prisma.pageAsset.findUnique({
      where: { id: assetId },
      include: { page: true },
    });

    if (!asset || asset.pageId !== id) {
      return NextResponse.json({ error: "Mídia não encontrada nesta página" }, { status: 404 });
    }

    // Apenas o dono ou autor do upload pode remover
    const canDelete = asset.userId === currentUser.id || asset.page.ownerId === currentUser.id;
    if (!canDelete) {
      return NextResponse.json({ error: "Sem permissão para excluir esta mídia" }, { status: 403 });
    }

    // Remove do disco
    const filePath = path.join(process.cwd(), "public", "uploads", asset.filename);
    try {
      await fs.unlink(filePath);
    } catch (e) {
      // Ignora se o arquivo já tiver sido removido do disco
    }

    // Remove do banco de dados SQLite
    await prisma.pageAsset.delete({
      where: { id: assetId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir mídia:", error);
    return NextResponse.json({ error: "Falha ao excluir asset" }, { status: 500 });
  }
}
