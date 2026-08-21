import type { Tag } from "../../db/schema/tag.js";

export interface PublicTag {
  id: string;
  projectId: string;
  name: string;
  color: string;
  createdAt: Date;
}

export function toPublicTag(tag: Tag): PublicTag {
  return {
    id: tag.id,
    projectId: tag.projectId,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt,
  };
}
