import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    // Busca apenas os projetos que o usuário é dono ou tem compartilhamento
    const projects = await prisma.world.findMany({
      where: {
        OR: [
          { ownerId: currentUser.id },
          {
            shares: {
              some: {
                OR: [
                  { sharedWithEmail: currentUser.email },
                  { sharedWithUserId: currentUser.id },
                ],
              },
            },
          },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            pages: true,
            maps: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Erro ao listar projetos:", error);
    return NextResponse.json({ error: "Erro ao consultar projetos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { name, description, coverImage } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "O nome do projeto é obrigatório" }, { status: 400 });
    }

    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const newProject = await prisma.world.create({
      data: {
        ownerId: currentUser.id,
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        coverImage: coverImage?.trim() || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        isPublic: false,
      },
    });

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    return NextResponse.json({ error: "Erro ao criar projeto" }, { status: 500 });
  }
}
