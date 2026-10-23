"use client";

import React, { useState } from "react";
import { WikiTreeSidebar, WikiPageItem } from "./WikiTreeSidebar";
import { WikiEditor } from "@/components/editor/WikiEditor";

export interface WikiClientContainerProps {
  projectId: string;
  projectName: string;
  initialPages: WikiPageItem[];
  cards?: { id: string; title: string; category?: string }[];
  page: {
    id: string;
    title: string;
    contentMarkdown: string;
    contentJson: string;
    isSecret: boolean;
    tags: string;
    properties: string;
    updatedAt: string;
    createdAt: string;
    owner: { id: string; name: string; email: string };
    template?: { id: string; name: string; category: string } | null;
  };
  isOwner: boolean;
}

export function WikiClientContainer({
  projectId,
  projectName,
  initialPages,
  cards = [],
  page,
  isOwner,
}: WikiClientContainerProps) {
  // Estado de recolhimento da sidebar para visualização completa estilo Notion
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [pages, setPages] = useState<WikiPageItem[]>(initialPages);
  const [currentPageTitle, setCurrentPageTitle] = useState(page.title);
  const [isSecret, setIsSecret] = useState(page.isSecret);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleToggleSecret = async (newSecret: boolean) => {
    setIsSecret(newSecret);
    try {
      await fetch(`/api/pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSecret: newSecret }),
      });
      setPages((prev) =>
        prev.map((p) => (p.id === page.id ? { ...p, isSecret: newSecret } : p))
      );
    } catch (err) {
      console.error("Erro ao alterar segredo:", err);
    }
  };

  return (
    <div className="flex flex-1 w-full h-full overflow-hidden relative">
      {/* 1. Sidebar Hierárquica com Suporte a Recolher/Minimizar */}
      <div
        className={`transition-all duration-300 ease-in-out h-full flex shrink-0 ${
          isSidebarCollapsed
            ? "-ml-72 w-72 opacity-0 pointer-events-none"
            : "ml-0 w-72 opacity-100"
        }`}
      >
        <WikiTreeSidebar
          projectId={projectId}
          pages={pages}
          currentPageId={page.id}
          isOwner={isOwner}
          onCollapseSidebar={handleToggleSidebar}
        />
      </div>

      {/* 2. Área do Editor com Visualização Completa */}
      <main className="flex-1 h-full overflow-hidden flex flex-col min-w-0 bg-[#0d0f14]">
        <WikiEditor
          key={page.id}
          pageId={page.id}
          projectId={projectId}
          pageTitle={currentPageTitle}
          category={page.template?.name || "Artigo Geral"}
          initialContent={page.contentMarkdown}
          isSecret={isSecret}
          authorName={page.owner.name}
          updatedAt={page.updatedAt}
          allPages={pages.map((p) => ({ id: p.id, title: p.title }))}
          allCards={cards}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
          onToggleSecret={handleToggleSecret}
          onPageUpdated={(newTitle) => {
            setCurrentPageTitle(newTitle);
            setPages((prev) =>
              prev.map((p) => (p.id === page.id ? { ...p, title: newTitle } : p))
            );
          }}
        />
      </main>
    </div>
  );
}
