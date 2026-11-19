import { Logger } from '@nestjs/common';

import type { SearchService } from '@app/search/search.service';

import { COMMENT_CREATED } from '../comments.constants';
import { CommentCreatedEvent } from '../events/comment-created.event';
import type { CommentsGateway } from '../gateway/comments.gateway';
import { CommentCreatedListener } from './comment-created.listener';

describe('CommentCreatedListener', () => {
  it('logs, broadcasts, and indexes the comment', async () => {
    const gateway = {
      broadcastCommentCreated: jest.fn(),
    };
    const searchService = {
      index: jest.fn().mockResolvedValue(undefined),
    };
    const listener = new CommentCreatedListener(
      gateway as unknown as CommentsGateway,
      searchService as unknown as SearchService,
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
