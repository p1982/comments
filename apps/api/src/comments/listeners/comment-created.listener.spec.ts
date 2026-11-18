import { Logger } from '@nestjs/common';

import { COMMENT_CREATED, COMMENTS_LIST_CACHE_VERSION_KEY } from '../comments.constants';
import { CommentCreatedEvent } from '../events/comment-created.event';
import type { CommentsGateway } from '../gateway/comments.gateway';
import { CommentCreatedListener } from './comment-created.listener';

describe('CommentCreatedListener', () => {
  it('logs, broadcasts, and bumps the comments list cache version', async () => {
    const gateway = {
      broadcastCommentCreated: jest.fn(),
    };
    const cache = {
      get: jest.fn().mockResolvedValue(2),
      set: jest.fn().mockResolvedValue(undefined),
    };
    const listener = new CommentCreatedListener(
      gateway as unknown as CommentsGateway,
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
    expect(COMMENT_CREATED).toBe('comment.created');
    log.mockRestore();
  });
});
