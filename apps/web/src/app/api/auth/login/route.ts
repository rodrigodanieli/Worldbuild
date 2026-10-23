import { NextResponse } from "next/server";
import { prisma, verifyPassword } from "@worldbuild/database";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { settings: true },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Credenciais inválidas. Verifique o e-mail e a senha." },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("worldbuild_session", user.id, {
      httpOnly: true,
      secure: false, // Permite funcionamento em http://localhost
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
    });

    let settings = {};
    if (user.settings?.settings) {
      try {
        settings = JSON.parse(user.settings.settings);
      } catch {
        settings = {};
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        settings,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
