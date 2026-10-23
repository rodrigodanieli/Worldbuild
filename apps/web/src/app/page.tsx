import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@worldbuild/database";
import { ProjectsDashboard, ProjectItem } from "@/components/projects/ProjectsDashboard";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<React.JSX.Element> {
  const currentUser = await getCurrentUser();

  // Se o usuário não estiver logado, redireciona para o fluxo de login/cadastro
  // evitando que veja páginas 404 vazias
  if (!currentUser) {
    redirect("/login");
  }

  // Busca do SQLite APENAS os projetos aos quais o usuário tem acesso (dono ou compartilhado)
  const userProjects = await prisma.world.findMany({
    where: {
      OR: [
        { ownerId: currentUser.id },
        {
          shares: {
            some: {
              OR: [
                { sharedWithEmail: currentUser.email },
                { sharedWithUserId: currentUser.id },
              ],
            },
          },
        },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: {
        select: {
          pages: true,
          maps: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ProjectsDashboard
      user={currentUser}
      initialProjects={userProjects as unknown as ProjectItem[]}
    />
  );
}
