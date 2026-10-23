import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";

interface RouteProps {
  params: Promise<{ id: string; boardId: string }>;
}

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { id, boardId } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const board = await prisma.board.findFirst({
      where: { id: boardId, worldId: id },
      include: {
        world: {
          select: {
            id: true,
            ownerId: true,
            shares: true,
          },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board não encontrado" }, { status: 404 });
    }

    const isMember =
      board.world.ownerId === currentUser.id ||
      board.world.shares.some(
        (s) => s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id
      );

    if (!isMember) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json({ board });
  } catch (error) {
    console.error("Erro ao buscar board:", error);
    return NextResponse.json({ error: "Erro ao buscar board" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteProps) {
  try {
    const { id, boardId } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const board = await prisma.board.findFirst({
      where: { id: boardId, worldId: id },
      include: {
        world: {
          select: {
            id: true,
            ownerId: true,
            shares: true,
          },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board não encontrado" }, { status: 404 });
    }

    const isEditor =
      board.world.ownerId === currentUser.id ||
      board.world.shares.some(
        (s) =>
          (s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id) &&
          s.role !== "viewer"
      );

    if (!isEditor) {
      return NextResponse.json(
        { error: "Permissão insuficiente para alterar este board" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.name !== undefined && typeof body.name === "string" && body.name.trim()) {
      updateData.name = body.name.trim();
    }
    if (body.description !== undefined) {
      updateData.description = body.description ? String(body.description).trim() : null;
    }
    if (body.data !== undefined) {
      updateData.data = typeof body.data === "string" ? body.data : JSON.stringify(body.data);
    }

    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: updateData,
    });

    return NextResponse.json({ success: true, board: updatedBoard });
  } catch (error) {
    console.error("Erro ao atualizar board:", error);
    return NextResponse.json({ error: "Erro ao atualizar board" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteProps) {
  try {
    const { id, boardId } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const board = await prisma.board.findFirst({
      where: { id: boardId, worldId: id },
      include: {
        world: {
          select: {
            id: true,
            ownerId: true,
            shares: true,
          },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board não encontrado" }, { status: 404 });
    }

    const isOwner =
      board.world.ownerId === currentUser.id ||
      board.world.shares.some(
        (s) =>
          (s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id) &&
          s.role === "editor"
      );

    if (!isOwner) {
      return NextResponse.json(
        { error: "Permissão insuficiente para excluir este board" },
        { status: 403 }
      );
    }

    // Contagem de boards do projeto
    const totalBoards = await prisma.board.count({
      where: { worldId: id },
    });

    if (totalBoards <= 1) {
      return NextResponse.json(
        { error: "Não é possível excluir o único board do projeto. Crie outro board antes de excluir este." },
        { status: 400 }
      );
    }

    await prisma.board.delete({
      where: { id: boardId },
    });

    // Retorna o próximo board restante para direcionamento
    const nextBoard = await prisma.board.findFirst({
      where: { worldId: id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, nextBoard });
  } catch (error) {
    console.error("Erro ao deletar board:", error);
    return NextResponse.json({ error: "Erro ao excluir board" }, { status: 500 });
  }
}
