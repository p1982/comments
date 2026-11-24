import type { CommentsSchema } from '../schema/comments/comments.schema.js';
import type { UserVoteValue } from '../schema/comments/comment-vote.schema.js';

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

export interface CommentAttachments {
  id: string;
  fileName: string;
  fileType: 'image' | 'text';
  mimeType: string;
  url: string;
}

export interface CommentResponse {
  id: string;
  text: string;
  createdAt: string;
  fullName: string;
  email: string;
  homepage: string;
  parentId: string | null;
  repliesCount?: number;
  votesScore?: number;
  userVote?: UserVoteValue;
  attachments: CommentAttachments[];
}

export interface CommentVoteResult {
  commentId: string;
  votesScore: number;
  userVote: UserVoteValue;
}

export interface CommentVotedEventPayload {
  commentId: string;
  rootId: string;
  votesScore: number;
}

export interface CommentsResult {
  data: CommentResponse[];
  total?: number;
  totalPages?: number;
  status: 'success' | 'error';
  message: string;
}

export interface CreateCommentResponse {
  data: CommentResponse;
  status: 'success' | 'error';
  message: string;
}
