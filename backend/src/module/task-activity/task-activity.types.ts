export type TaskActivityAction =
  | "created"
  | "status_changed"
  | "priority_changed"
  | "due_date_changed"
  | "assigned"
  | "commented"
  | "tag_added"
  | "deleted";

export interface ActivityActor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface PublicTaskActivity {
  id: string;
  taskId: string;
  action: TaskActivityAction;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  /** Null if the acting user's account has since been deleted. */
  actor: ActivityActor | null;
  createdAt: Date;
}

interface ActivityWithActor {
  id: string;
  taskId: string;
  action: TaskActivityAction;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
  actor: ActivityActor | null;
}

export function toPublicActivity(activity: ActivityWithActor): PublicTaskActivity {
  return {
    id: activity.id,
    taskId: activity.taskId,
    action: activity.action,
    field: activity.field,
    oldValue: activity.oldValue,
    newValue: activity.newValue,
    actor: activity.actor,
    createdAt: activity.createdAt,
  };
}
