import { Injectable, Logger } from '@nestjs/common';

import type { CommentJob } from './comment-job';
import { CommentJobProcessor } from './comment-job.processor';

@Injectable()
export class CommentQueueService {
  private readonly logger = new Logger(CommentQueueService.name);
  private readonly jobs: CommentJob[] = [];
  private running = false;

  constructor(private readonly processor: CommentJobProcessor) {}

  enqueue(job: CommentJob) {
    this.logger.debug(
      `Enqueuing job ${job.type} for comment ${
        job.type === 'comment-created' ? job.comment.id : job.commentId
      }`,
    );
    this.jobs.push(job);
    void this.pump();
  }

  private async pump() {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      while (this.jobs.length > 0) {
        const job = this.jobs.shift();
        if (!job) {
          break;
        }
        await this.processor.handle(job);
      }
    } finally {
      this.running = false;
    }
  }
}
