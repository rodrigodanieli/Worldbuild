import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";
import { ProjectHeader } from "@/components/layout/ProjectHeader";
import { CleanPageView } from "@/components/wiki/CleanPageView";
import { WikiClientContainer } from "@/components/wiki/WikiClientContainer";
import { WikiPageItem } from "@/components/wiki/WikiTreeSidebar";

export const dynamic = "force-dynamic";

interface ScopedWikiPageProps {
  params: Promise<{ projectId: string; pageId: string }>;
}

export default async function ScopedWikiPage({ params }: ScopedWikiPageProps): Promise<React.JSX.Element> {
  const { projectId, pageId } = await params;
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
      pages: {
        select: { id: true, title: true, isSecret: true, parentId: true },
        orderBy: { createdAt: "asc" },
      },
      cards: {
        select: { id: true, title: true, category: true, isSecret: true },
        orderBy: { createdAt: "desc" },
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

  // 2. Busca o artigo específico
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: true,
      template: {
        select: { id: true, name: true, category: true },
      },
    },
  });

  if (!page || page.worldId !== projectId) {
    notFound();
  }

  // Se o usuário tiver papel apenas de visualizador (viewer), exibe o modo limpo de leitura
  if (!isOwner && projectShare?.role === "viewer") {
    let properties = {};
    let tags: string[] = [];
    try {
      properties = JSON.parse(page.properties);
      tags = JSON.parse(page.tags);
    } catch {}

    return (
      <CleanPageView
        title={page.title}
        category={page.template?.name || "Artigo Geral"}
        authorName={page.owner.name}
        contentMarkdown={page.contentMarkdown}
        properties={properties}
        tags={tags}
        updatedAt={page.updatedAt.toISOString()}
      />
    );
  }

  // Lista de páginas visíveis
  const visiblePages: WikiPageItem[] = project.pages
    .filter((p) => isOwner || !p.isSecret)
    .map((p) => ({
      id: p.id,
      title: p.title,
      parentId: p.parentId,
      isSecret: p.isSecret,
    }));

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d0f14]">
      {/* 1. Header Global do Projeto */}
      <ProjectHeader
        projectId={project.id}
        projectName={project.name}
        user={currentUser}
      />

      {/* 2. Container Interativo da Wiki Estilo Notion */}
      <WikiClientContainer
        projectId={project.id}
        projectName={project.name}
        initialPages={visiblePages}
        cards={project.cards
          .filter((c) => isOwner || !c.isSecret)
          .map((c) => ({ id: c.id, title: c.title, category: c.category || "Personagem / NPC" }))}
        page={{
          id: page.id,
          title: page.title,
          contentMarkdown: page.contentMarkdown,
          contentJson: page.contentJson,
          isSecret: page.isSecret,
          tags: page.tags,
          properties: page.properties,
          updatedAt: page.updatedAt.toISOString(),
          createdAt: page.createdAt.toISOString(),
          owner: page.owner,
          template: page.template,
        }}
        isOwner={isOwner}
      />
    </div>
  );
}
