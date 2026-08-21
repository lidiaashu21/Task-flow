"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/error";
import { deleteProject, getProject, leaveProject } from "@/lib/projects/api";
import { getTaskDashboard } from "@/lib/tasks/api";
import { priorityBadgeVariant, priorityLabels, statusLabels } from "@/lib/tasks/display";
import { formatDate } from "@/lib/format";

export default function ProjectOverviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { fetcher } = useAuth();
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const projectQuery = useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => getProject(fetcher, projectId),
  });

  const dashboardQuery = useQuery({
    queryKey: ["projects", projectId, "dashboard"],
    queryFn: () => getTaskDashboard(fetcher, projectId),
  });

  if (projectQuery.isLoading) return <Spinner />;
  if (projectQuery.isError || !projectQuery.data) {
    return <p className="text-sm text-red-600 dark:text-red-400">This project couldn&apos;t be loaded.</p>;
  }

  const { project } = projectQuery.data;
  const dashboard = dashboardQuery.data?.dashboard;
  const isOwner = project.myRole === "owner";

  async function handleDelete() {
    try {
      await deleteProject(fetcher, projectId);
      toast.success("Project deleted");
      router.push("/projects");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't delete the project");
    }
  }

  async function handleLeave() {
    try {
      await leaveProject(fetcher, projectId);
      toast.success("You left the project");
      router.push("/projects");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't leave the project");
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{project.name}</h1>
              {isOwner && <Badge variant="blue">Owner</Badge>}
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {project.description || "No description yet."}
            </p>
          </div>
          <div className="flex gap-2">
            {isOwner ? (
              <>
                <Button variant="outline" className="w-auto px-4" onClick={() => setEditOpen(true)}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="w-auto border-red-200 px-4 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </Button>
              </>
            ) : (
              <Button variant="outline" className="w-auto px-4" onClick={() => setLeaveOpen(true)}>
                Leave project
              </Button>
            )}
          </div>
        </div>

        <p className="mt-3 text-xs text-zinc-400">Created {formatDate(project.createdAt)}</p>
      </div>

      <ProjectTabs projectId={projectId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Total tasks</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{dashboard?.totalTasks ?? "—"}</p>
          </CardBody>
        </Card>
        {(["todo", "in_progress", "done"] as const).map((status) => (
          <Card key={status}>
            <CardBody>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{statusLabels[status]}</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {dashboard?.statusCounts[status] ?? "—"}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Your overdue tasks</h2>
          {!dashboard?.myOverdueTasks.length ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Nothing overdue — you&apos;re all caught up.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {dashboard.myOverdueTasks.map((task) => (
                <li key={task.id}>
                  <a
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:border-blue-300 dark:border-zinc-800 dark:hover:border-blue-800"
                  >
                    <span className="truncate text-zinc-800 dark:text-zinc-200">{task.title}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge variant={priorityBadgeVariant[task.priority]}>{priorityLabels[task.priority]}</Badge>
                      {task.dueDate && <span className="text-xs text-red-600 dark:text-red-400">{formatDate(task.dueDate)}</span>}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <EditProjectDialog project={project} open={editOpen} onClose={() => setEditOpen(false)} />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete this project?"
        description="This permanently deletes the project and everything in it. This can't be undone."
        confirmLabel="Delete project"
      />
      <ConfirmDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={handleLeave}
        title="Leave this project?"
        description="You'll lose access to its tasks and messages until someone adds you back."
        confirmLabel="Leave project"
      />
    </div>
  );
}
