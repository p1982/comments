import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { SearchService } from '@app/search/search.service';

import { COMMENT_CREATED } from '../comments.constants';
import { toCommentResponse } from '../dto/comment-response.dto';
import { CommentCreatedEvent } from '../events/comment-created.event';
import { CommentsGateway } from '../gateway/comments.gateway';
import { CommentsRepository } from '../repository/comments.repository';

@Injectable()
export class CommentCreatedListener {
  private readonly logger = new Logger(CommentCreatedListener.name);
  constructor(
    private readonly gateway: CommentsGateway,
    private readonly searchService: SearchService,
    private readonly commentsRepository: CommentsRepository,
  ) {}

  @OnEvent(COMMENT_CREATED)
  async handle(event: CommentCreatedEvent) {
    this.logger.log(`comment.created ${event.comment.id}`);
    const latest = await this.commentsRepository.findById(event.comment.id);
    const broadcastPayload = latest?.user
      ? toCommentResponse(latest, latest.user, event.comment.repliesCount ?? 0)
      : event.comment;

    this.gateway.broadcastCommentCreated(broadcastPayload);
    await this.searchService.index({
      id: event.comment.id,
      parentId: event.comment.parentId,
      fullName: event.comment.fullName,
      text: event.comment.text,
      createdAt: event.comment.createdAt,
    });
  }
}
