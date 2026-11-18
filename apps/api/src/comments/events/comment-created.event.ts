import type { CommentResponse } from '@comments/shared';

export class CommentCreatedEvent {
  constructor(public readonly comment: CommentResponse) {}
}
