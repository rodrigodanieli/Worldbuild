import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const worldSlug = searchParams.get("world") || "reino-de-eldoria";
    const isDm = searchParams.get("dm") === "true";

    const world = await prisma.world.findUnique({
      where: { slug: worldSlug },
    });

    if (!world) {
      return NextResponse.json({ error: "Mundo não encontrado" }, { status: 404 });
    }

    const maps = await prisma.worldMap.findMany({
      where: {
        worldId: world.id,
        ...(isDm ? {} : { isSecret: false }),
      },
      include: {
        pins: {
          where: isDm ? {} : { isSecret: false },
          include: {
            page: {
              select: { id: true, title: true, slug: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ maps });
  } catch (error) {
    console.error("Erro ao listar mapas do banco SQLite:", error);
    return NextResponse.json({ error: "Erro ao consultar mapas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mapId, x, y, title, description, category, color, isSecret, tags, pageId } = body;

    const newPin = await prisma.mapPin.create({
      data: {
        mapId,
        x,
        y,
        title,
        description: description || null,
        category: category || "landmark",
        color: color || "#38bdf8",
        isSecret: !!isSecret,
        tags: JSON.stringify(tags || []),
        pageId: pageId || null,
      },
    });

    return NextResponse.json({ pin: newPin }, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar pino no banco SQLite:", error);
    return NextResponse.json({ error: "Erro ao criar pino" }, { status: 500 });
  }
}
