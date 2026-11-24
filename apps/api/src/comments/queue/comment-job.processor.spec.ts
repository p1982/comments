import { mkdir, writeFile } from 'node:fs/promises';

import sharp from 'sharp';

import { COMMENT_CREATED, COMMENTS_LIST_CACHE_VERSION_KEY } from '../comments.constants';
import { CommentCreatedEvent } from '../events/comment-created.event';
import { CommentJobProcessor } from './comment-job.processor';

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
}));

describe('CommentJobProcessor', () => {
  const manager = {};
  const dataSource = {
    transaction: jest.fn(async (callback: (current: unknown) => Promise<unknown>) => {
      return await callback(manager);
    }),
  };
  const attachmentsRepository = { create: jest.fn() };
  const commentsRepository = { findById: jest.fn() };
  const commentsGateway = { broadcastCommentCreated: jest.fn() };
  const cache = { get: jest.fn(), set: jest.fn() };
  const events = { emit: jest.fn() };
  const processor = new CommentJobProcessor(
    dataSource as never,
    attachmentsRepository as never,
    commentsRepository as never,
    commentsGateway as never,
    cache as never,
    events as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    cache.get.mockResolvedValue(undefined);
    commentsRepository.findById.mockResolvedValue(null);
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('22222222-2222-2222-2222-222222222222');
  });

  it('fits an image, stores attachment, invalidates list cache, and broadcasts update', async () => {
    const png = await sharp({
      create: { width: 10, height: 10, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();
    cache.get.mockResolvedValue(2);
    commentsRepository.findById.mockResolvedValue({
      id: 'comment-1',
      text: 'Hello',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      parentId: null,
      votesScore: 0,
      user: { fullName: 'Ann', email: 'ann@example.com', homepage: '' },
      attachments: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          fileName: 'photo.png',
          file_type: 'image',
          mimeType: 'image/png',
          storageKey: '22222222-2222-2222-2222-222222222222.png',
        },
      ],
    });

    await processor.handle({
      type: 'process-image',
      commentId: 'comment-1',
      fileName: 'photo.png',
      buffer: png,
    });

    expect(mkdir).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalled();
    expect(attachmentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        commentId: 'comment-1',
        fileName: 'photo.png',
        file_type: 'image',
        mimeType: 'image/png',
      }),
      manager,
    );
    expect(cache.set).toHaveBeenCalledWith(COMMENTS_LIST_CACHE_VERSION_KEY, 3);
    expect(commentsGateway.broadcastCommentCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'comment-1',
        attachments: [expect.objectContaining({ fileName: 'photo.png', fileType: 'image' })],
      }),
    );
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('skips invalid image buffers without writing or broadcasting', async () => {
    await processor.handle({
      type: 'process-image',
      commentId: 'comment-1',
      fileName: 'broken.png',
      buffer: Buffer.from('not-an-image'),
    });

    expect(writeFile).not.toHaveBeenCalled();
    expect(attachmentsRepository.create).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
    expect(commentsGateway.broadcastCommentCreated).not.toHaveBeenCalled();
  });

  it('emits comment.created for the comment-created job', async () => {
    const comment = {
      id: 'comment-1',
      text: 'Hello',
      createdAt: '2026-01-01T00:00:00.000Z',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: '',
      parentId: null,
      attachments: [],
    };

    await processor.handle({ type: 'comment-created', comment });

    expect(events.emit).toHaveBeenCalledWith(COMMENT_CREATED, expect.any(CommentCreatedEvent));
  });
});
