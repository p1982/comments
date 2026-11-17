import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { COMMENT_CREATED, CommentCreatedEvent } from '../events/comment-created.event';
import { CommentsGateway } from '../gateway/comments.gateway';

@Injectable()
export class CommentCreatedListener {
  private readonly logger = new Logger(CommentCreatedListener.name);
  constructor(private readonly gateway: CommentsGateway) {}

  @OnEvent(COMMENT_CREATED)
  handle(event: CommentCreatedEvent) {
    this.logger.log(`comment.created ${event.comment.id}`);
    this.gateway.broadcastCommentCreated(event.comment);
  }
}
