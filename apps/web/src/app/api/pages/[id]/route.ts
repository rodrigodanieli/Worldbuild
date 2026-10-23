import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/pages/[id] - Detalhes da página
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        world: {
          include: {
            shares: true,
          },
        },
        template: true,
        children: {
          select: { id: true, title: true, isSecret: true, parentId: true },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
    }

    // Verifica permissão de acesso
    const isOwner = page.ownerId === currentUser.id || page.world.ownerId === currentUser.id;
    const isShared = page.world.shares.some(
      (s) => s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id
    );

    if (!isOwner && !isShared) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error("Erro ao carregar página:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// PUT /api/pages/[id] - Salvamento automático e atualização da página no banco SQLite
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        world: {
          include: {
            shares: true,
          },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
    }

    // Verifica se o usuário tem permissão para editar (dono ou editor compartilhado)
    const isOwner = page.ownerId === currentUser.id || page.world.ownerId === currentUser.id;
    const isEditor = page.world.shares.some(
      (s) => (s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id) && s.role !== "viewer"
    );

    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: "Sem permissão de edição" }, { status: 403 });
    }

    const body = await request.json();
    const { title, contentMarkdown, contentJson, tags, isSecret, parentId } = body;

    const updateData: Record<string, any> = {};

    if (typeof title === "string" && title.trim().length > 0) {
      updateData.title = title.trim();
      updateData.slug = title
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
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

    if (parentId !== undefined) {
      updateData.parentId = parentId;
    }

    const updatedPage = await prisma.page.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      page: updatedPage,
      updatedAt: updatedPage.updatedAt,
    });
  } catch (error) {
    console.error("Erro no salvamento automático da página:", error);
    return NextResponse.json({ error: "Falha ao salvar página" }, { status: 500 });
  }
}

// DELETE /api/pages/[id] - Exclusão de página
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        world: true,
        children: true,
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
    }

    const isOwner = page.ownerId === currentUser.id || page.world.ownerId === currentUser.id;
    if (!isOwner) {
      return NextResponse.json({ error: "Apenas o proprietário pode excluir páginas" }, { status: 403 });
    }

    // Reparent subpages to null (or page's parent)
    if (page.children.length > 0) {
      await prisma.page.updateMany({
        where: { parentId: page.id },
        data: { parentId: page.parentId },
      });
    }

    await prisma.page.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir página:", error);
    return NextResponse.json({ error: "Erro ao excluir página" }, { status: 500 });
  }
}
