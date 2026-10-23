import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";
import { ProjectHeader } from "@/components/layout/ProjectHeader";
import { MAPS_DATABASE, MapData } from "@/components/maps/fantasy-map-data";
import { ClientProjectMapWrapper } from "@/components/maps/ClientProjectMapWrapper";

interface ProjectMapsPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectMapsPage({ params }: ProjectMapsPageProps): Promise<React.JSX.Element> {
  const { projectId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const project = await prisma.world.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: true,
      maps: {
        include: {
          pins: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Prepara os mapas persistidos no banco SQLite (ou usa o preset se for o primeiro)
  const mapData: MapData = {
    id: "map-eldoria-world",
    title: `Mapa Geral de ${project.name}`,
    subtitle: "Cartografia Oficial da Campanha",
    category: "world",
    width: 2400,
    height: 1600,
    backgroundSvgTheme: "world",
    pins: MAPS_DATABASE[0].pins,
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d0f14]">
      {/* Header Padrão do Projeto com Logo e Profile Dropdown */}
      <ProjectHeader
        projectId={project.id}
        projectName={project.name}
        user={currentUser}
      />

      {/* Área Central Cartográfica */}
      <main className="flex-1 w-full h-full relative overflow-hidden flex">
        <ClientProjectMapWrapper initialMap={mapData} />
      </main>
    </div>
  );
}
