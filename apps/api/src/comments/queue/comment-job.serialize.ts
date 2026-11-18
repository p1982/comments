import type { CommentResponse } from '@comments/shared';

import type { CommentJob } from './comment-job';

export type SerializedCommentJob =
  | {
      type: 'process-image';
      commentId: string;
      fileName: string;
      bufferBase64: string;
    }
  | {
      type: 'comment-created';
      comment: CommentResponse;
    };

export function serializeCommentJob(job: CommentJob): SerializedCommentJob {
  switch (job.type) {
    case 'process-image':
      return {
        type: 'process-image',
        commentId: job.commentId,
        fileName: job.fileName,
        bufferBase64: job.buffer.toString('base64'),
      };
    case 'comment-created':
      return {
        type: 'comment-created',
        comment: job.comment,
      };
  }
}

export function deserializeCommentJob(payload: SerializedCommentJob): CommentJob {
  switch (payload.type) {
    case 'process-image':
      return {
        type: 'process-image',
        commentId: payload.commentId,
        fileName: payload.fileName,
        buffer: Buffer.from(payload.bufferBase64, 'base64'),
      };
    case 'comment-created':
      return {
        type: 'comment-created',
        comment: payload.comment,
      };
  }
}
