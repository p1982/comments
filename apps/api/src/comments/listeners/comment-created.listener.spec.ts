import { Logger } from '@nestjs/common';

import { COMMENT_CREATED, CommentCreatedEvent } from '../events/comment-created.event';
import type { CommentsGateway } from '../gateway/comments.gateway';
import { CommentCreatedListener } from './comment-created.listener';

describe('CommentCreatedListener', () => {
  it('logs and broadcasts the created comment', () => {
    const gateway = {
      broadcastCommentCreated: jest.fn(),
    };
    const listener = new CommentCreatedListener(gateway as unknown as CommentsGateway);
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

    listener.handle(event);

    expect(log).toHaveBeenCalledWith(`comment.created ${event.comment.id}`);
    expect(gateway.broadcastCommentCreated).toHaveBeenCalledWith(event.comment);
    expect(COMMENT_CREATED).toBe('comment.created');
    log.mockRestore();
  });
});
