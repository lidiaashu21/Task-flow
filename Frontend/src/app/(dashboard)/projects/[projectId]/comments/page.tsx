"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { ProjectComments } from "@/components/projects/project-comments";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth/auth-context";
import { getProject } from "@/lib/projects/api";

export default function ProjectCommentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { fetcher } = useAuth();

  const projectQuery = useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => getProject(fetcher, projectId),
  });

  if (projectQuery.isLoading) return <Spinner />;
  if (projectQuery.isError || !projectQuery.data) {
    return <p className="text-sm text-red-600 dark:text-red-400">This project couldn&apos;t be loaded.</p>;
  }

  const { project } = projectQuery.data;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{project.name}</h1>

      <ProjectTabs projectId={projectId} />

      <ProjectComments projectId={projectId} />
    </div>
  );
}
