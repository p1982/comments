import type { CommentResponse } from '@comments/shared';
export const COMMENT_CREATED = 'comment.created';

export class CommentCreatedEvent {
  constructor(public readonly comment: CommentResponse) {}
}
