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
  actor: ActivityActor | null;
  createdAt: string;
}
