import { NextResponse } from "next/server";
import { prisma, hashPassword } from "@worldbuild/database";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Nome, e-mail e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma conta cadastrada com este e-mail" },
        { status: 409 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash: hashPassword(password),
        settings: {
          create: {
            settings: JSON.stringify({
              theme: "dark",
              showDmSecrets: true,
              editorFontSize: "normal",
            }),
          },
        },
      },
      include: { settings: true },
    });

    // Define cookie de sessão
    const cookieStore = await cookies();
    cookieStore.set("worldbuild_session", newUser.id, {
      httpOnly: true,
      secure: false, // Permite funcionamento em http://localhost
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
    });

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          settings: JSON.parse(newUser.settings!.settings),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro no cadastro:", error);
    return NextResponse.json({ error: "Erro interno ao cadastrar usuário" }, { status: 500 });
  }
}
