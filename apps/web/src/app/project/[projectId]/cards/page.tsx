import { redirect, notFound } from "next/navigation";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface ProjectCardsIndexProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectCardsIndexPage({ params }: ProjectCardsIndexProps) {
  const { projectId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const project = await prisma.world.findUnique({
    where: { id: projectId },
    include: {
      shares: true,
      cards: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (!project) {
    notFound();
  }

  const isOwner = project.ownerId === currentUser.id;
  const projectShare = project.shares.find(
    (s) => s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id
  );

  if (!isOwner && !projectShare) {
    notFound();
  }

  // Se já tiver um card criado, redireciona diretamente para o ID dele
  if (project.cards.length > 0) {
    redirect(`/project/${projectId}/cards/${project.cards[0].id}`);
  }

  // Caso o projeto não tenha cards ainda, inicializa tags e cria um card inicial no banco SQLite
  const existingTags = await prisma.cardTag.findMany({ where: { worldId: project.id } });
  let firstTagId = existingTags[0]?.id;
  if (existingTags.length === 0) {
    const t = await prisma.cardTag.create({
      data: { worldId: project.id, name: "Personagem / NPC", color: "#f59e0b" },
    });
    firstTagId = t.id;
  }

  const newCard = await prisma.card.create({
    data: {
      worldId: project.id,
      ownerId: project.ownerId,
      title: "Primeiro Card de Campanha",
      slug: "primeiro-card",
      category: "Personagem / NPC",
      tagId: firstTagId || null,
      contentMarkdown: `# Primeiro Card de Campanha\n\nBem-vindo ao sistema de **Cards da Campanha**!\n\nEste recurso permite organizar itens, personagens, monstros, locais e segredos de forma ágil.\n\nUse \`/\` para comandos rápidos ou \`@\` para conectar este card a Artigos da Wiki ou outros Cards.`,
      tags: JSON.stringify(["inicio", "card"]),
    },
  });

  redirect(`/project/${projectId}/cards/${newCard.id}`);
}
