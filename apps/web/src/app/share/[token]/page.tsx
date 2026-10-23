import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";
import { CleanPageView } from "@/components/wiki/CleanPageView";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedLinkPage({ params }: SharePageProps): Promise<React.JSX.Element> {
  const { token } = await params;
  
  // 1. Regra: Verificar se existe um usuário logado. Caso não, 404 imediato.
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    notFound();
  }

  // 2. Busca a página pelo token de compartilhamento único
  const page = await prisma.page.findUnique({
    where: { shareToken: token },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      template: true,
      shares: true,
    },
  });

  if (!page) {
    notFound();
  }

  // 3. Verifica se o usuário tem permissão para visualizar o conteúdo compartilhado:
  // (Pode ser o dono, ter o token de link único válido, ou estar na lista de shares)
  const isOwner = currentUser.id === page.ownerId;
  const isSharedByEmail = page.shares.some(
    (s) => s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id
  );

  const hasAccess = isOwner || isSharedByEmail || !!page.shareToken;

  if (!hasAccess) {
    notFound();
  }

  let properties = {};
  let tags: string[] = [];

  try {
    properties = JSON.parse(page.properties);
  } catch {
    properties = {};
  }

  try {
    tags = JSON.parse(page.tags);
  } catch {
    tags = [];
  }

  // Exibe exclusivamente no Formato de Visualização Limpa:
  // "sem menu ou outro botão de edição ou navegação, apenas um para ir para a home"
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
