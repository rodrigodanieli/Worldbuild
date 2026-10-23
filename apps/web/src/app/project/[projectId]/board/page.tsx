import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";
import { WhiteboardClientContainer } from "@/components/whiteboard/WhiteboardClientContainer";

interface ProjectBoardPageProps {
  params: Promise<{ projectId: string }>;
  searchParams?: Promise<{ boardId?: string }>;
}

export default async function ProjectBoardPage({
  params,
  searchParams,
}: ProjectBoardPageProps): Promise<React.JSX.Element> {
  const { projectId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const requestedBoardId = resolvedSearchParams?.boardId;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const project = await prisma.world.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      whiteboardData: true,
      ownerId: true,
      shares: true,
    },
  });

  if (!project) {
    notFound();
  }

  // Permissão de acesso
  const isMember =
    project.ownerId === currentUser.id ||
    project.shares.some(
      (s) => s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id
    );

  if (!isMember) {
    redirect("/");
  }

  // Carrega boards existentes do projeto
  let boards = await prisma.board.findMany({
    where: { worldId: projectId },
    orderBy: { createdAt: "asc" },
  });

  // Se ainda não existir nenhum board, migra/cria o board inicial padrão
  if (boards.length === 0) {
    let initialData = '{"nodes":[],"edges":[]}';
    if (project.whiteboardData) {
      try {
        const parsed = JSON.parse(project.whiteboardData);
        if (parsed && (Array.isArray(parsed.nodes) || Array.isArray(parsed.edges))) {
          initialData = project.whiteboardData;
        }
      } catch {}
    }

    const defaultBoard = await prisma.board.create({
      data: {
        worldId: projectId,
        name: "Quadro Principal",
        description: "Quadro inicial de cartões e relacionamentos",
        data: initialData,
      },
    });

    boards = [defaultBoard];
  }

  // Determina o board ativo
  const activeBoard =
    boards.find((b) => b.id === requestedBoardId) || boards[0];

  // Carrega cards com suas respectivas tags
  const cards = await prisma.card.findMany({
    where: { worldId: projectId },
    include: { tag: true },
    orderBy: { createdAt: "desc" },
  });

  // Carrega tags cadastradas no projeto
  const tags = await prisma.cardTag.findMany({
    where: { worldId: projectId },
    orderBy: { createdAt: "asc" },
  });

  // Carrega páginas da wiki do projeto com respectiva categoria
  const rawPages = await prisma.page.findMany({
    where: { worldId: projectId },
    select: {
      id: true,
      title: true,
      slug: true,
      contentMarkdown: true,
      template: {
        select: {
          category: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const pages = rawPages.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    contentMarkdown: p.contentMarkdown,
    category: p.template?.category || p.template?.name || "Wiki",
  }));

  return (
    <WhiteboardClientContainer
      projectId={project.id}
      projectName={project.name}
      initialBoards={boards}
      initialActiveBoardId={activeBoard.id}
      initialCards={cards}
      initialTags={tags}
      initialPages={pages}
      user={currentUser}
    />
  );
}
