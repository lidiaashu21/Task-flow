export interface CommentAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface PublicComment {
  id: string;
  taskId: string;
  body: string;
  author: CommentAuthor;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}
