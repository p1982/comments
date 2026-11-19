import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { SearchService } from '@app/search/search.service';

import { COMMENT_CREATED } from '../comments.constants';
import { CommentCreatedEvent } from '../events/comment-created.event';
import { CommentsGateway } from '../gateway/comments.gateway';

@Injectable()
export class CommentCreatedListener {
  private readonly logger = new Logger(CommentCreatedListener.name);
  constructor(
    private readonly gateway: CommentsGateway,
    private readonly searchService: SearchService,
  ) {}

  @OnEvent(COMMENT_CREATED)
  async handle(event: CommentCreatedEvent) {
    this.logger.log(`comment.created ${event.comment.id}`);
    this.gateway.broadcastCommentCreated(event.comment);
    await this.searchService.index({
      id: event.comment.id,
      parentId: event.comment.parentId,
      fullName: event.comment.fullName,
      text: event.comment.text,
      createdAt: event.comment.createdAt,
    });
  }
}
