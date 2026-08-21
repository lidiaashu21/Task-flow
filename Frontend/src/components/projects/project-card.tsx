import { CheckSquare, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import type { ProjectSummary } from "@/lib/projects/types";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full transition-colors hover:border-blue-300 dark:hover:border-blue-800">
        <CardBody className="flex h-full flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{project.name}</h3>
            {project.myRole === "owner" && <Badge variant="blue">Owner</Badge>}
          </div>
          <p className="line-clamp-2 flex-1 text-sm text-zinc-500 dark:text-zinc-400">
            {project.description || "No description yet."}
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {project.memberCount}
            </span>
            <span className="flex items-center gap-1">
              <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
              {project.taskCount}
            </span>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
