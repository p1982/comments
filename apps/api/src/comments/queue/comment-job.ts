import type { CommentResponse } from '@comments/shared';

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
