import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const project = await prisma.world.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        ownerId: true,
        whiteboardData: true,
        shares: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }

    const isMember =
      project.ownerId === currentUser.id ||
      project.shares.some(
        (s) => s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id
      );

    if (!isMember) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Busca todos os boards do projeto
    let boards = await prisma.board.findMany({
      where: { worldId: id },
      orderBy: { createdAt: "asc" },
    });

    // Se ainda não existir nenhum board, migra/cria o board inicial padrão
    if (boards.length === 0) {
      let initialData = '{"nodes":[],"edges":[]}';
      if (project.whiteboardData) {
        try {
          const parsed = JSON.parse(project.whiteboardData);
          if (parsed && (Array.isArray(parsed.nodes) || Array.isArray(parsed.edges))) {
            initialData = project.whiteboardData;
          }
        } catch {}
      }

      const defaultBoard = await prisma.board.create({
        data: {
          worldId: id,
          name: "Quadro Principal",
          description: "Quadro inicial de cartões e relacionamentos",
          data: initialData,
        },
      });

      boards = [defaultBoard];
    }

    return NextResponse.json({ boards });
  } catch (error) {
    console.error("Erro ao listar boards do projeto:", error);
    return NextResponse.json({ error: "Erro ao consultar boards" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const project = await prisma.world.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        shares: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }

    const isEditor =
      project.ownerId === currentUser.id ||
      project.shares.some(
        (s) =>
          (s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id) &&
          s.role !== "viewer"
      );

    if (!isEditor) {
      return NextResponse.json(
        { error: "Permissão insuficiente para criar novos boards" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Novo Board";
    const description = typeof body.description === "string" ? body.description.trim() : null;
    const data =
      typeof body.data === "string"
        ? body.data
        : JSON.stringify(body.data || { nodes: [], edges: [] });

    const newBoard = await prisma.board.create({
      data: {
        worldId: id,
        name,
        description,
        data,
      },
    });

    return NextResponse.json({ board: newBoard }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar novo board:", error);
    return NextResponse.json({ error: "Erro ao criar board" }, { status: 500 });
  }
}
