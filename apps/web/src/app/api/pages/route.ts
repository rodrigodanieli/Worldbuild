import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const worldId = searchParams.get("worldId");
    const worldSlug = searchParams.get("world");
    const isDm = searchParams.get("dm") === "true";

    const whereClause: Record<string, any> = {};
    if (worldId) {
      whereClause.worldId = worldId;
    } else if (worldSlug) {
      const world = await prisma.world.findUnique({
        where: { slug: worldSlug },
      });
      if (!world) {
        return NextResponse.json({ error: "Mundo não encontrado" }, { status: 404 });
      }
      whereClause.worldId = world.id;
    }

    if (!isDm) {
      whereClause.isSecret = false;
    }

    const pages = await prisma.page.findMany({
      where: whereClause,
      include: {
        template: {
          select: { name: true, category: true, icon: true },
        },
        children: {
          select: { id: true, title: true, isSecret: true, parentId: true },
        },
        dndSheet: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Erro ao listar páginas da wiki:", error);
    return NextResponse.json({ error: "Erro ao consultar o banco" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { worldId, title, templateId, parentId, contentMarkdown, isSecret, tags } = body;

    if (!worldId || !title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Mundo (worldId) e Título são obrigatórios" }, { status: 400 });
    }

    // Verifica se o mundo existe e se o usuário tem permissão para adicionar páginas
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
      return NextResponse.json({ error: "Sem permissão para criar páginas neste projeto" }, { status: 403 });
    }

    // Se houver parentId, garante que ele pertence ao mesmo projeto
    if (parentId) {
      const parentPage = await prisma.page.findUnique({
        where: { id: parentId },
      });
      if (!parentPage || parentPage.worldId !== worldId) {
        return NextResponse.json({ error: "Página pai inválida" }, { status: 400 });
      }
    }

    const cleanTitle = title.trim();
    const baseSlug = cleanTitle
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-") || "pagina";
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const initialContent = contentMarkdown || `<h1>${cleanTitle}</h1><p>Comece a escrever sobre ${cleanTitle}. Use <code>/</code> para blocos e <code>@</code> para vincular outras páginas.</p>`;

    const newPage = await prisma.page.create({
      data: {
        worldId,
        ownerId: currentUser.id,
        title: cleanTitle,
        slug,
        templateId: templateId || null,
        parentId: parentId || null,
        contentMarkdown: initialContent,
        contentJson: "{}",
        isSecret: !!isSecret,
        tags: JSON.stringify(tags || []),
      },
      include: {
        template: true,
      },
    });

    return NextResponse.json({ success: true, page: newPage }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar página no banco SQLite:", error);
    return NextResponse.json({ error: "Erro ao criar página" }, { status: 500 });
  }
}
