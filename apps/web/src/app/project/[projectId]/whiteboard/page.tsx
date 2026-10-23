import { redirect } from "next/navigation";

interface ProjectWhiteboardPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectWhiteboardPage({
  params,
}: ProjectWhiteboardPageProps): Promise<never> {
  const { projectId } = await params;
  redirect(`/project/${projectId}/board`);
}
