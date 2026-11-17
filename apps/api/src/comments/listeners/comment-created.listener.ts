import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { COMMENT_CREATED, CommentCreatedEvent } from '../events/comment-created.event';

@Injectable()
export class CommentCreatedListener {
  private readonly logger = new Logger(CommentCreatedListener.name);

  @OnEvent(COMMENT_CREATED)
  handle(event: CommentCreatedEvent) {
    this.logger.log(`comment.created ${event.comment.id}`);
    // п.26: gateway.broadcast(event.comment)
  }
}
