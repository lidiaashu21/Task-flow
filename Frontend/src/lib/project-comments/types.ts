export interface ProjectCommentAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface PublicProjectComment {
  id: string;
  projectId: string;
  authorId: string;
  body: string;
  author: ProjectCommentAuthor;
  createdAt: string;
}
