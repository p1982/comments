import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import {
  COMMENT_JOB_CLIENT,
  COMMENT_QUEUE_NAME,
  type CommentJob,
  type CommentQueuePort,
} from './comment-job';
import { serializeCommentJob } from './comment-job.serialize';

@Injectable()
export class RabbitCommentQueueService implements CommentQueuePort {
  private readonly logger = new Logger(RabbitCommentQueueService.name);

  constructor(@Inject(COMMENT_JOB_CLIENT) private readonly client: ClientProxy) {}

  enqueue(job: CommentJob): void {
    this.logger.debug(
      `Publishing job ${job.type} for comment ${
        job.type === 'comment-created' ? job.comment.id : job.commentId
      }`,
    );
    this.client.emit(COMMENT_QUEUE_NAME, serializeCommentJob(job));
  }
}
