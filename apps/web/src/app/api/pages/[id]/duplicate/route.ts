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

    const sourcePage = await prisma.page.findUnique({
      where: { id },
      include: { world: true },
    });

    if (!sourcePage) {
      return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
    }

    const isOwner = sourcePage.ownerId === currentUser.id || sourcePage.world.ownerId === currentUser.id;
    if (!isOwner) {
      return NextResponse.json({ error: "Sem permissão para duplicar" }, { status: 403 });
    }

    const newTitle = `${sourcePage.title} (Cópia)`;
    const baseSlug = newTitle
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const newPage = await prisma.page.create({
      data: {
        worldId: sourcePage.worldId,
        ownerId: currentUser.id,
        title: newTitle,
        slug,
        parentId: sourcePage.parentId,
        templateId: sourcePage.templateId,
        contentMarkdown: sourcePage.contentMarkdown,
        contentJson: sourcePage.contentJson,
        tags: sourcePage.tags,
        properties: sourcePage.properties,
        isSecret: sourcePage.isSecret,
      },
    });

    return NextResponse.json({ success: true, page: newPage }, { status: 201 });
  } catch (error) {
    console.error("Erro ao duplicar página:", error);
    return NextResponse.json({ error: "Erro ao duplicar página" }, { status: 500 });
  }
}
