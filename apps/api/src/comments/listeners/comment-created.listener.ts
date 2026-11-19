import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { SearchService } from '@app/search/search.service';

import { COMMENT_CREATED, COMMENTS_LIST_CACHE_VERSION_KEY } from '../comments.constants';
import { CommentCreatedEvent } from '../events/comment-created.event';
import { CommentsGateway } from '../gateway/comments.gateway';

@Injectable()
export class CommentCreatedListener {
  private readonly logger = new Logger(CommentCreatedListener.name);
  constructor(
    private readonly gateway: CommentsGateway,
    private readonly searchService: SearchService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  @OnEvent(COMMENT_CREATED)
  async handle(event: CommentCreatedEvent) {
    this.logger.log(`comment.created ${event.comment.id}`);
    this.gateway.broadcastCommentCreated(event.comment);
    await this.clearCommentsListCache();
    await this.searchService.index({
      id: event.comment.id,
      parentId: event.comment.parentId,
      fullName: event.comment.fullName,
      text: event.comment.text,
      createdAt: event.comment.createdAt,
    });
  }

  private async clearCommentsListCache() {
    const version = (await this.cache.get<number>(COMMENTS_LIST_CACHE_VERSION_KEY)) ?? 0;
    const next = version + 1;
    await this.cache.set(COMMENTS_LIST_CACHE_VERSION_KEY, next);
    this.logger.debug(`comments list cache bumped to v${String(next)}`);
  }
}
