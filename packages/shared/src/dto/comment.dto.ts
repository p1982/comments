import type { CommentsSchema } from '../schema/comments/comments.schema.js';

export type CreateCommentRequest = CommentsSchema;

export const commentSortFields = ['createdAt', 'fullName', 'email'] as const;

export const commentSortOrders = ['asc', 'desc'] as const;

export type CommentSortField = (typeof commentSortFields)[number];

export type CommentSortOrder = (typeof commentSortOrders)[number];

export interface GetCommentsQuery {
  page?: number;
  limit?: number;
  sort?: CommentSortField;
  order?: CommentSortOrder;
}

export interface CommentResponse {
  id: string;
  text: string;
  createdAt: string;
  fullName: string;
  email: string;
  homepage: string;
  parentId: string | null;
}
