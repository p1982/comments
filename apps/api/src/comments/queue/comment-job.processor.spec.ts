import { mkdir, writeFile } from 'node:fs/promises';

import sharp from 'sharp';

import { COMMENT_CREATED } from '../comments.constants';
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
  const events = { emit: jest.fn() };
  const processor = new CommentJobProcessor(
    dataSource as never,
    attachmentsRepository as never,
    events as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('22222222-2222-2222-2222-222222222222');
  });

  it('fits an image, writes it, and stores the attachment', async () => {
    const png = await sharp({
      create: { width: 10, height: 10, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();

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
    expect(events.emit).not.toHaveBeenCalled();
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
