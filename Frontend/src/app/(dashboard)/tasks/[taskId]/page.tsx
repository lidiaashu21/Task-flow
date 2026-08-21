"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { use } from "react";
import { TaskActivityLog } from "@/components/tasks/task-activity-log";
import { TaskComments } from "@/components/tasks/task-comments";
import { TaskDetailsForm } from "@/components/tasks/task-details-form";
import { TaskTags } from "@/components/tasks/task-tags";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth/auth-context";
import { getProject } from "@/lib/projects/api";
import { getTask } from "@/lib/tasks/api";

export default function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params);
  const { fetcher } = useAuth();

  const taskQuery = useQuery({
    queryKey: ["tasks", taskId],
    queryFn: () => getTask(fetcher, taskId),
  });

  const task = taskQuery.data?.task;

  const projectQuery = useQuery({
    queryKey: ["projects", task?.projectId],
    queryFn: () => getProject(fetcher, task!.projectId),
    enabled: !!task,
  });

  if (taskQuery.isLoading || !task) return <Spinner />;

  const members = projectQuery.data?.project.members ?? [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href={`/projects/${task.projectId}/tasks`}
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to tasks
      </Link>

      <Card>
        <CardBody className="flex flex-col gap-5">
          <TaskTags taskId={taskId} projectId={task.projectId} />
          <TaskDetailsForm task={task} members={members} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Comments</h2>
        </CardHeader>
        <CardBody>
          <TaskComments taskId={taskId} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Activity</h2>
        </CardHeader>
        <CardBody>
          <TaskActivityLog taskId={taskId} />
        </CardBody>
      </Card>
    </div>
  );
}
