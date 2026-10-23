import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";

export async function GET() {
  try {
    const worlds = await prisma.world.findMany({
      include: {
        _count: {
          select: {
            pages: true,
            maps: true,
            templates: true,
            relations: true,
          },
        },
      },
    });

    return NextResponse.json({ worlds });
  } catch (error) {
    console.error("Erro ao listar mundos do banco SQLite:", error);
    return NextResponse.json(
      { error: "Falha ao buscar dados do banco SQLite" },
      { status: 500 }
    );
  }
}
