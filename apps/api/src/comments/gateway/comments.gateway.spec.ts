import { Logger } from '@nestjs/common';

import type { CommentResponse } from '@comments/shared';
import { WS_COMMENT_CREATED, WS_COMMENT_VOTED } from '@comments/shared';

import { CommentsGateway } from './comments.gateway';

describe('CommentsGateway', () => {
  it('broadcasts comment.created through the socket server', () => {
    const gateway = new CommentsGateway();
    const emit = jest.fn();
    gateway.server = { emit } as never;

    const comment: CommentResponse = {
      id: '11111111-1111-1111-1111-111111111111',
      text: 'Hello',
      createdAt: '2026-01-01T00:00:00.000Z',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: 'https://ann.example',
      parentId: null,
      attachments: [],
    };

    gateway.broadcastCommentCreated(comment);

    expect(emit).toHaveBeenCalledWith(WS_COMMENT_CREATED, comment);

    const votePayload = { commentId: comment.id, rootId: comment.id, votesScore: 2 };
    gateway.broadcastCommentVoted(votePayload);
    expect(emit).toHaveBeenCalledWith(WS_COMMENT_VOTED, votePayload);

    const uninitialized = new CommentsGateway();
    expect(() => uninitialized.broadcastCommentCreated(comment)).not.toThrow();
    expect(() => uninitialized.broadcastCommentVoted(votePayload)).not.toThrow();
  });

  it('logs when a client connects', () => {
    const gateway = new CommentsGateway();
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    gateway.handleConnection();

    expect(log).toHaveBeenCalledWith('Client connected');
    log.mockRestore();
  });
});
