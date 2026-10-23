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

    let parsedData = {};
    if (project.whiteboardData) {
      try {
        parsedData = JSON.parse(project.whiteboardData);
      } catch {
        parsedData = {};
      }
    }

    return NextResponse.json({ whiteboardData: parsedData });
  } catch (error) {
    console.error("Erro ao carregar dados do whiteboard:", error);
    return NextResponse.json({ error: "Erro ao buscar whiteboard" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteProps) {
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
      return NextResponse.json({ error: "Permissão insuficiente para salvar alterações" }, { status: 403 });
    }

    const body = await request.json();
    const serializedData =
      typeof body.whiteboardData === "string"
        ? body.whiteboardData
        : JSON.stringify(body.whiteboardData ?? {});

    const updated = await prisma.world.update({
      where: { id },
      data: {
        whiteboardData: serializedData,
      },
      select: {
        id: true,
        whiteboardData: true,
      },
    });

    return NextResponse.json({ success: true, whiteboardData: updated.whiteboardData });
  } catch (error) {
    console.error("Erro ao salvar whiteboard:", error);
    return NextResponse.json({ error: "Erro interno ao salvar whiteboard" }, { status: 500 });
  }
}
