"use client";

import { useQuery } from "@tanstack/react-query";
import { FolderKanban, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth/auth-context";
import { listProjects } from "@/lib/projects/api";

export default function ProjectsPage() {
  const { fetcher } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjects(fetcher),
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Image
            src="/Image/p3.png"
            alt=""
            width={64}
            height={64}
            className="hidden h-16 w-16 rounded-xl object-cover sm:block"
          />
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Projects</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Every project you&apos;re a member of.</p>
          </div>
        </div>
        <Button className="w-auto px-4" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New project
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !projects?.length ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to start organizing tasks with your team."
          action={
            <Button className="w-auto px-4" onClick={() => setCreateOpen(true)}>
              Create a project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
