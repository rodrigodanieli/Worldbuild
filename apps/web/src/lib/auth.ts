import { cookies } from "next/headers";
import { prisma } from "@worldbuild/database";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  settings: Record<string, any>;
}

/**
 * Obtém o usuário atualmente autenticado via cookie de sessão
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("worldbuild_session")?.value;

    if (!sessionUserId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: { settings: true },
    });

    if (!user) {
      return null;
    }

    let parsedSettings = {};
    if (user.settings?.settings) {
      try {
        parsedSettings = JSON.parse(user.settings.settings);
      } catch {
        parsedSettings = {};
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      settings: parsedSettings,
    };
  } catch (error) {
    console.error("Erro ao verificar sessão do usuário:", error);
    return null;
  }
}
