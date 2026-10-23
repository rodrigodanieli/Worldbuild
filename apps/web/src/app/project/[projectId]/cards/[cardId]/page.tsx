import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";
import { ProjectHeader } from "@/components/layout/ProjectHeader";
import { CardsClientContainer } from "@/components/cards/CardsClientContainer";
import { CardItem } from "@/components/cards/CardsSidebar";

export const dynamic = "force-dynamic";

interface ScopedCardPageProps {
  params: Promise<{ projectId: string; cardId: string }>;
}

export default async function ScopedCardPage({
  params,
}: ScopedCardPageProps): Promise<React.JSX.Element> {
  const { projectId, cardId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // 1. Busca o projeto e verifica acesso
  const project = await prisma.world.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: true,
      cardTags: {
        include: {
          templates: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      cards: {
        select: { id: true, title: true, category: true, tagId: true, isSecret: true },
        orderBy: { createdAt: "desc" },
      },
      pages: {
        select: {
          id: true,
          title: true,
          isSecret: true,
          template: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
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

  // 2. Busca o card específico no SQLite
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  if (!card || card.worldId !== projectId) {
    notFound();
  }

  // Se o card for secreto de DM e o usuário não for dono nem editor com permissão
  if (card.isSecret && !isOwner && projectShare?.role === "viewer") {
    notFound();
  }

  // Lista de cards visíveis para a sidebar
  const visibleCards: CardItem[] = project.cards
    .map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category || "Personagem / NPC",
      tagId: c.tagId,
    }));

  // Lista de artigos da Wiki para menções via @
  const visiblePages = project.pages
    .filter((p) => isOwner || !p.isSecret)
    .map((p) => ({
      id: p.id,
      title: p.title,
      category: p.template?.name || "Artigo Geral",
    }));

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d0f14]">
      {/* 1. Header Global do Projeto */}
      <ProjectHeader
        projectId={project.id}
        projectName={project.name}
        user={currentUser}
      />

      {/* 2. Container Interativo dos Cards com Gerenciador de Janelas */}
      <CardsClientContainer
        projectId={project.id}
        projectName={project.name}
        initialCards={visibleCards}
        initialTags={project.cardTags}
        allPages={visiblePages}
        card={{
          id: card.id,
          title: card.title,
          category: card.category || "Personagem / NPC",
          tagId: card.tagId,
          coverImage: card.coverImage,
          icon: card.icon,
          customFields: card.customFields,
          contentMarkdown: card.contentMarkdown,
          contentJson: card.contentJson,
          tags: card.tags,
          properties: card.properties,
          updatedAt: card.updatedAt.toISOString(),
          createdAt: card.createdAt.toISOString(),
          owner: card.owner,
        }}
        isOwner={isOwner}
      />
    </div>
  );
}
