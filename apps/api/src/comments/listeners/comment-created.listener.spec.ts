import { Logger } from '@nestjs/common';

import type { SearchService } from '@app/search/search.service';

import { COMMENT_CREATED } from '../comments.constants';
import { CommentCreatedEvent } from '../events/comment-created.event';
import type { CommentsGateway } from '../gateway/comments.gateway';
import type { CommentsRepository } from '../repository/comments.repository';
import { CommentCreatedListener } from './comment-created.listener';

describe('CommentCreatedListener', () => {
  it('logs, broadcasts event fallback when comment is not reloaded, and indexes', async () => {
    const gateway = {
      broadcastCommentCreated: jest.fn(),
    };
    const searchService = {
      index: jest.fn().mockResolvedValue(undefined),
    };
    const commentsRepository = {
      findById: jest.fn().mockResolvedValue(null),
    };
    const listener = new CommentCreatedListener(
      gateway as unknown as CommentsGateway,
      searchService as unknown as SearchService,
      commentsRepository as unknown as CommentsRepository,
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
    expect(commentsRepository.findById).toHaveBeenCalledWith(event.comment.id);
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

  it('broadcasts fresh DB attachments so outbox does not overwrite processed images', async () => {
    const gateway = {
      broadcastCommentCreated: jest.fn(),
    };
    const searchService = {
      index: jest.fn().mockResolvedValue(undefined),
    };
    const commentsRepository = {
      findById: jest.fn().mockResolvedValue({
        id: '11111111-1111-1111-1111-111111111111',
        text: 'Hello',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        parentId: 'parent-1',
        votesScore: 2,
        user: {
          fullName: 'Ann',
          email: 'ann@example.com',
          homepage: 'https://ann.example',
        },
        attachments: [
          {
            id: 'att-1',
            fileName: 'photo.png',
            file_type: 'image',
            mimeType: 'image/png',
            storageKey: 'att-1.png',
          },
        ],
      }),
    };
    const listener = new CommentCreatedListener(
      gateway as unknown as CommentsGateway,
      searchService as unknown as SearchService,
      commentsRepository as unknown as CommentsRepository,
    );
    const event = new CommentCreatedEvent({
      id: '11111111-1111-1111-1111-111111111111',
      text: 'Hello',
      createdAt: '2026-01-01T00:00:00.000Z',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: 'https://ann.example',
      parentId: 'parent-1',
      attachments: [],
    });

    await listener.handle(event);

    expect(gateway.broadcastCommentCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        id: event.comment.id,
        votesScore: 2,
        attachments: [
          {
            id: 'att-1',
            fileName: 'photo.png',
            fileType: 'image',
            mimeType: 'image/png',
            url: '/assets/att-1.png',
          },
        ],
      }),
    );
  });
});
