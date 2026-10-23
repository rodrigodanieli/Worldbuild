import { redirect } from "next/navigation";

interface ProjectMindmapPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectMindmapPage({ params }: ProjectMindmapPageProps) {
  const { projectId } = await params;
  redirect(`/project/${projectId}/cards`);
}
