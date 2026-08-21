import { tagRepository } from "./tag.repository.js";
import { AppError } from "../../shared/error/app-error.js";
import { toPublicTag, type PublicTag } from "./tag.types.js";
import type { CreateTagInput, UpdateTagInput } from "./tag.schema.js";
import type { NewTag } from "../../db/schema/tag.js";

async function assertProjectMember(projectId: string, userId: string): Promise<void> {
  const membership = await tagRepository.findProjectMember(projectId, userId);
  if (!membership) {
    throw AppError.forbidden("You are not a member of this project");
  }
}

async function assertTaskAccess(taskId: string, userId: string) {
  const task = await tagRepository.findTaskById(taskId);
  if (!task) {
    throw AppError.notFound("Task not found");
  }
  await assertProjectMember(task.projectId, userId);
  return task;
}

export const tagService = {
  async create(projectId: string, userId: string, input: CreateTagInput): Promise<PublicTag> {
    await assertProjectMember(projectId, userId);

    const existing = await tagRepository.findByProjectAndName(projectId, input.name);
    if (existing) {
      throw AppError.conflict("A tag with this name already exists in the project");
    }

    const tag = await tagRepository.createTag({ projectId, name: input.name, color: input.color });
    return toPublicTag(tag);
  },

  async list(projectId: string, userId: string): Promise<PublicTag[]> {
    await assertProjectMember(projectId, userId);
    const rows = await tagRepository.listByProject(projectId);
    return rows.map(toPublicTag);
  },

  async update(tagId: string, userId: string, input: UpdateTagInput): Promise<PublicTag> {
    const tag = await tagRepository.findTagById(tagId);
    if (!tag) {
      throw AppError.notFound("Tag not found");
    }
    await assertProjectMember(tag.projectId, userId);

    if (input.name && input.name !== tag.name) {
      const existing = await tagRepository.findByProjectAndName(tag.projectId, input.name);
      if (existing) {
        throw AppError.conflict("A tag with this name already exists in the project");
      }
    }

    const patch: Partial<NewTag> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.color !== undefined) patch.color = input.color;

    const updated = await tagRepository.updateTag(tagId, patch);
    return toPublicTag(updated);
  },

  async remove(tagId: string, userId: string): Promise<void> {
    const tag = await tagRepository.findTagById(tagId);
    if (!tag) {
      throw AppError.notFound("Tag not found");
    }
    await assertProjectMember(tag.projectId, userId);
    await tagRepository.deleteTag(tagId);
  },

  async attachToTask(taskId: string, tagId: string, userId: string): Promise<void> {
    const task = await assertTaskAccess(taskId, userId);

    const tag = await tagRepository.findTagById(tagId);
    if (!tag || tag.projectId !== task.projectId) {
      throw AppError.badRequest("This tag doesn't belong to the task's project");
    }

    await tagRepository.attachToTask(taskId, tagId);
  },

  async detachFromTask(taskId: string, tagId: string, userId: string): Promise<void> {
    await assertTaskAccess(taskId, userId);
    await tagRepository.detachFromTask(taskId, tagId);
  },

  async listForTask(taskId: string, userId: string): Promise<PublicTag[]> {
    await assertTaskAccess(taskId, userId);
    const rows = await tagRepository.listByTask(taskId);
    return rows.map(toPublicTag);
  },
};
