import { Logger } from '@nestjs/common';

import type { SearchService } from '@app/search/search.service';

import { COMMENT_CREATED, COMMENTS_LIST_CACHE_VERSION_KEY } from '../comments.constants';
import { CommentCreatedEvent } from '../events/comment-created.event';
import type { CommentsGateway } from '../gateway/comments.gateway';
import { CommentCreatedListener } from './comment-created.listener';

describe('CommentCreatedListener', () => {
  it('logs, broadcasts, bumps cache, and indexes the comment', async () => {
    const gateway = {
      broadcastCommentCreated: jest.fn(),
    };
    const searchService = {
      index: jest.fn().mockResolvedValue(undefined),
    };
    const cache = {
      get: jest.fn().mockResolvedValue(2),
      set: jest.fn().mockResolvedValue(undefined),
    };
    const listener = new CommentCreatedListener(
      gateway as unknown as CommentsGateway,
      searchService as unknown as SearchService,
      cache as never,
    );
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const event = new CommentCreatedEvent({
      id: '11111111-1111-1111-1111-111111111111',
      text: 'Hello',
      createdAt: '2026-01-01T00:00:00.000Z',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: 'https://ann.example',
      parentId: null,
      attachments: [],
    });

    await listener.handle(event);

    expect(log).toHaveBeenCalledWith(`comment.created ${event.comment.id}`);
    expect(gateway.broadcastCommentCreated).toHaveBeenCalledWith(event.comment);
    expect(cache.get).toHaveBeenCalledWith(COMMENTS_LIST_CACHE_VERSION_KEY);
    expect(cache.set).toHaveBeenCalledWith(COMMENTS_LIST_CACHE_VERSION_KEY, 3);
    expect(searchService.index).toHaveBeenCalledWith({
      id: event.comment.id,
      parentId: event.comment.parentId,
      fullName: event.comment.fullName,
      text: event.comment.text,
      createdAt: event.comment.createdAt,
    });
    expect(COMMENT_CREATED).toBe('comment.created');
    log.mockRestore();
  });
});
