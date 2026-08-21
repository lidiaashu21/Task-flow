"use client";

import { useQuery } from "@tanstack/react-query";
import { FolderKanban, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth/auth-context";
import { listProjects } from "@/lib/projects/api";

export default function DashboardOverviewPage() {
  const { fetcher, user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjects(fetcher),
  });

  const totalTasks =
    projects?.reduce((sum, project) => sum + project.taskCount, 0) ?? 0;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Image
            src="/Image/p2.png"
            alt=""
            width={64}
            height={64}
            className="hidden h-16 w-16 rounded-xl object-cover sm:block"
          />
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Here&apos;s what&apos;s happening across your projects.
            </p>
          </div>
        </div>
        <Button className="w-auto px-4" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New project
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Projects" value={projects?.length ?? 0} />
        <StatCard label="Total tasks" value={totalTasks} />
        <StatCard
          label="Owned projects"
          value={projects?.filter((p) => p.myRole === "owner").length ?? 0}
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Your projects
          </h2>
          {!!projects?.length && (
            <Link
              href="/projects"
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              View all
            </Link>
          )}
        </div>

        {isLoading ? (
          <Spinner />
        ) : !projects?.length ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to start organizing tasks with your team."
            action={
              <Button
                className="w-auto px-4"
                onClick={() => setCreateOpen(true)}
              >
                Create a project
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <CreateProjectDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
