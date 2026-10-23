import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@worldbuild/database";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userSettings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({
    settings: userSettings?.settings ? JSON.parse(userSettings.settings) : {},
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Obtém as configurações atuais para mesclar
    const existing = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    const currentSettings = existing?.settings ? JSON.parse(existing.settings) : {};
    const updatedSettings = { ...currentSettings, ...body };

    const saved = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        settings: JSON.stringify(updatedSettings),
      },
      create: {
        userId: user.id,
        settings: JSON.stringify(updatedSettings),
      },
    });

    return NextResponse.json({
      settings: JSON.parse(saved.settings),
    });
  } catch (error) {
    console.error("Erro ao atualizar configurações do usuário:", error);
    return NextResponse.json({ error: "Erro ao salvar preferências" }, { status: 500 });
  }
}
