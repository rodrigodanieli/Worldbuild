import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";
import { ProjectHeader } from "@/components/layout/ProjectHeader";
import { Clock, Calendar, Sparkles, Plus, CreditCard, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

interface ProjectTimelinePageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectTimelinePage({ params }: ProjectTimelinePageProps): Promise<React.JSX.Element> {
  const { projectId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const project = await prisma.world.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    notFound();
  }

  // Busca todos os cards do projeto com campos de data vinculados ao timeline
  const projectCards = await prisma.card.findMany({
    where: { worldId: projectId },
    include: { tag: true },
  });

  const cardTimelineEvents: Array<{
    id: string;
    cardId: string;
    year: string;
    title: string;
    desc: string;
    tagColor: string;
    tagName: string;
    coverImage?: string | null;
  }> = [];

  for (const card of projectCards) {
    try {
      const fields = card.customFields ? JSON.parse(card.customFields) : [];
      const props = card.properties ? JSON.parse(card.properties) : {};
      if (Array.isArray(fields)) {
        for (const field of fields) {
          if (field.type === "date" && field.linkToTimeline && props[field.id]) {
            cardTimelineEvents.push({
              id: `${card.id}-${field.id}`,
              cardId: card.id,
              year: String(props[field.id]),
              title: card.title,
              desc: `${field.label || "Data"}: ${props[field.id]} • Registrado no Card`,
              tagColor: card.tag?.color || "#38bdf8",
              tagName: card.tag?.name || card.category || "Card",
              coverImage: card.coverImage,
            });
          }
        }
      }
    } catch (e) {
      // Ignora erro de parse em dados legados
    }
  }

  const defaultEvents = [
    { year: "Ano 124 da 2ª Era", title: "A Batalha das Quatro Coroas", desc: "Fundação do conselho de regência e início da paz duradoura." },
    { year: "Ano 140 da 2ª Era", title: "Construção da Capital Valefundo", desc: "Conclusão das muralhas de pedra e abertura das forjas anãs." },
    { year: "Ano 158 da 2ª Era", title: "Descoberta da Tumba Esquecida", desc: "Expedição arcana sela os horrores no subsolo da cidade." },
    { year: "Presente (Ano 162)", title: "O Despertar do Vazio", desc: "Eventos da campanha atual iniciados pelos cultistas." },
  ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d0f14]">
      <ProjectHeader
        projectId={project.id}
        projectName={project.name}
        user={currentUser}
      />

      <main className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-6 py-10">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-8">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              Cronograma & Linha do Tempo ({project.name})
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Registro histórico cronológico sincronizado com eventos de Cards e marcos da campanha.
            </p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold transition shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Evento</span>
          </button>
        </div>

        {/* Linha do Tempo Visual */}
        <div className="relative border-l-2 border-amber-500/40 ml-4 space-y-8 pl-6">
          {/* 1. Eventos Sincronizados de Cards com linkToTimeline = true */}
          {cardTimelineEvents.map((evt) => (
            <div key={evt.id} className="relative group">
              <div
                className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-[#12151e] border-2 group-hover:scale-125 transition"
                style={{ borderColor: evt.tagColor }}
              />
              <div
                className="p-4 rounded-xl border bg-[#141721] transition shadow-md"
                style={{ borderColor: `${evt.tagColor}50` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${evt.tagColor}20`, color: evt.tagColor }}
                  >
                    📅 {evt.year}
                  </span>
                  <Link
                    href={`/project/${projectId}/cards`}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white transition"
                  >
                    <CreditCard className="h-3 w-3" />
                    <span>Ver Card</span>
                    <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                  </Link>
                </div>
                <h4 className="text-base font-bold text-white mt-1.5 flex items-center gap-2">
                  <span>{evt.title}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.2 rounded font-semibold border"
                    style={{
                      borderColor: `${evt.tagColor}40`,
                      color: evt.tagColor,
                      backgroundColor: `${evt.tagColor}15`,
                    }}
                  >
                    {evt.tagName}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {evt.desc}
                </p>
              </div>
            </div>
          ))}

          {/* 2. Eventos Padrão / Marcos Históricos */}
          {defaultEvents.map((evt, idx) => (
            <div key={idx} className="relative group">
              <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-[#12151e] border-2 border-amber-400 group-hover:scale-125 transition" />
              <div className="p-4 rounded-xl border border-slate-800 bg-[#141721] group-hover:border-amber-500/40 transition">
                <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  {evt.year}
                </span>
                <h4 className="text-base font-bold text-white mt-1">
                  {evt.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {evt.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
