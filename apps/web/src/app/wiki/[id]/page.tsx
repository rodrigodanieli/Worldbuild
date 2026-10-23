import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";
import { CleanPageView } from "@/components/wiki/CleanPageView";
import { WikiEditor } from "@/components/editor/WikiEditor";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Tag, ShieldAlert, Folder, User as UserIcon, Map, FileText } from "lucide-react";

interface WikiPageProps {
  params: Promise<{ id: string }>;
}

export default async function WikiArticlePage({ params }: WikiPageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  // 1. Regra: Verificar se existe um usuário logado. Caso não, 404 imediato.
  if (!currentUser) {
    notFound();
  }

  // 2. Busca o artigo correspondente no banco SQLite
  const page = await prisma.page.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: true,
      template: true,
      world: {
        include: {
          pages: {
            select: { id: true, title: true, isSecret: true, parentId: true },
          },
        },
      },
    },
  });

  if (!page) {
    notFound();
  }

  // 3. Verificação de Permissões:
  const isOwner = currentUser.id === page.ownerId;
  const userShare = page.shares.find(
    (s) => s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id
  );

  const hasAccess = isOwner || !!userShare;

  // Qualquer outro caso de acesso não autorizado resulta em 404
  if (!hasAccess) {
    notFound();
  }

  // Se o usuário tiver permissão apenas de "viewer" (leitura compartilhada),
  // exibe o conteúdo no formato de visualização limpa (sem menus, apenas botão Home)
  if (!isOwner && userShare?.role === "viewer") {
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

  // Caso seja o Mestre / Dono / Editor: exibe o editor completo com TipTap e Árvore
  const worldPages = page.world.pages;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d0f14]">
      {/* Sidebar Hierárquica do Dono com IDs na navegação */}
      <aside className="w-72 border-r border-slate-800/80 bg-[#12151e]/90 flex flex-col justify-between select-none">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-3 border-b border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Voltar ao Hub</span>
              </Link>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Editor (DM)
              </span>
            </div>

            <div className="text-xs font-bold text-slate-200 px-1 truncate">
              {page.world.name}
            </div>
          </div>

          {/* Lista de Páginas do Mundo com ID na URL */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 px-1">
              Páginas do Mundo
            </div>
            <div className="space-y-1">
              {worldPages.map((p) => {
                const isSelected = p.id === page.id;
                return (
                  <Link
                    key={p.id}
                    href={`/wiki/${p.id}`}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                      isSelected
                        ? "bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <span className="truncate">{p.title}</span>
                    {p.isSecret && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-900">
                        DM
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="p-3 border-t border-slate-800/80 bg-[#10131b] flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>ID: {page.id.substring(0, 13)}...</span>
            <span className="text-amber-400">SQLite</span>
          </div>
        </div>
      </aside>

      {/* Editor TipTap Integrado */}
      <main className="flex-1 h-full overflow-hidden flex flex-col">
        <WikiEditor
          key={page.id}
          pageId={page.id}
          projectId={page.worldId}
          pageTitle={page.title}
          category={page.template?.name || "Geral"}
          initialContent={page.contentMarkdown}
        />
      </main>
    </div>
  );
}
