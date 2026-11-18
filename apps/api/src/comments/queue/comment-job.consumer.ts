import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { COMMENT_QUEUE_NAME } from '../comments.constants';
import { CommentJobProcessor } from './comment-job.processor';
import { deserializeCommentJob, type SerializedCommentJob } from './comment-job.serialize';

@Controller()
export class CommentJobConsumer {
  private readonly logger = new Logger(CommentJobConsumer.name);

  constructor(private readonly processor: CommentJobProcessor) {}

  @EventPattern(COMMENT_QUEUE_NAME)
  async handle(@Payload() payload: SerializedCommentJob): Promise<void> {
    const job = deserializeCommentJob(payload);
    this.logger.debug(
      `Consuming job ${job.type} for comment ${
        job.type === 'comment-created' ? job.comment.id : job.commentId
      }`,
    );
    await this.processor.handle(job);
  }
}
