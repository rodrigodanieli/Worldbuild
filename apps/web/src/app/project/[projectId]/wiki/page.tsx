import { redirect, notFound } from "next/navigation";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface ProjectWikiIndexProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectWikiIndexPage({ params }: ProjectWikiIndexProps) {
  const { projectId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const project = await prisma.world.findUnique({
    where: { id: projectId },
    include: {
      pages: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Se já tiver uma página, redireciona diretamente para o ID dela
  if (project.pages.length > 0) {
    redirect(`/project/${projectId}/wiki/${project.pages[0].id}`);
  }

  // Caso o projeto não tenha páginas, cria uma página inicial no banco SQLite
  const newPage = await prisma.page.create({
    data: {
      worldId: project.id,
      ownerId: project.ownerId,
      title: `Bem-vindo a ${project.name}`,
      slug: "inicio",
      contentMarkdown: `# ${project.name}\n\nComece a registrar as localidades, facções, personagens e segredos desta campanha.\n\nDigite \`/\` para inserir blocos ou \`@\` para criar conexões.`,
      tags: JSON.stringify(["inicio", "lore"]),
    },
  });

  redirect(`/project/${projectId}/wiki/${newPage.id}`);
}
