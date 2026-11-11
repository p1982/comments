import type { CommentsSchema } from '../schema/comments/comments.schema.js';

export type CreateCommentRequest = CommentsSchema;

export interface CommentResponse {
  id: string;
  text: string;
  createdAt: string;
  fullName: string;
  email: string;
  homepage: string;
  parentId: string | null;
}
