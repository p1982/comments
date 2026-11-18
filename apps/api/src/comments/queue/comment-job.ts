import type { CommentResponse } from '@comments/shared';

export type CommentQueueMode = 'sync' | 'memory' | 'rabbit';

export type CommentJob =
  | {
      type: 'process-image';
      commentId: string;
      fileName: string;
      buffer: Buffer;
    }
  | {
      type: 'comment-created';
      comment: CommentResponse;
    };

export interface CommentQueuePort {
  enqueue(job: CommentJob): void | Promise<void>;
}

export const COMMENT_QUEUE = Symbol('COMMENT_QUEUE');
export const COMMENT_JOB_CLIENT = 'COMMENT_JOB_CLIENT';
export const COMMENT_QUEUE_NAME = 'comments.jobs';

export function resolveCommentQueueMode(value: string | undefined): CommentQueueMode {
  if (value === 'memory' || value === 'rabbit') {
    return value;
  }
  return 'sync';
}
