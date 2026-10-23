import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const project = await prisma.world.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }

    if (project.ownerId !== currentUser.id) {
      return NextResponse.json({ error: "Apenas o proprietário pode editar as configurações do projeto" }, { status: 403 });
    }

    const { name, coverImage, description } = await request.json();

    const updated = await prisma.world.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(coverImage !== undefined && { coverImage: coverImage?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    });

    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error("Erro ao atualizar projeto:", error);
    return NextResponse.json({ error: "Erro ao atualizar projeto" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const project = await prisma.world.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }

    if (project.ownerId !== currentUser.id) {
      return NextResponse.json({ error: "Apenas o proprietário pode excluir o projeto" }, { status: 403 });
    }

    await prisma.world.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir projeto:", error);
    return NextResponse.json({ error: "Erro ao excluir projeto" }, { status: 500 });
  }
}
