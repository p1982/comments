import sharp from 'sharp';

import { deserializeCommentJob, serializeCommentJob } from './comment-job.serialize';

describe('comment-job.serialize', () => {
  it('round-trips a process-image buffer through base64', async () => {
    const buffer = await sharp({
      create: { width: 4, height: 4, channels: 3, background: { r: 1, g: 2, b: 3 } },
    })
      .png()
      .toBuffer();

    const job = {
      type: 'process-image' as const,
      commentId: 'comment-1',
      fileName: 'photo.png',
      buffer,
    };

    const restored = deserializeCommentJob(serializeCommentJob(job));

    expect(restored).toEqual({
      type: 'process-image',
      commentId: 'comment-1',
      fileName: 'photo.png',
      buffer: expect.any(Buffer),
    });
    expect(Buffer.isBuffer(restored.type === 'process-image' ? restored.buffer : null)).toBe(true);
    if (restored.type === 'process-image') {
      expect(restored.buffer.equals(buffer)).toBe(true);
    }
  });

  it('round-trips a comment-created job', () => {
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

    expect(
      deserializeCommentJob(serializeCommentJob({ type: 'comment-created', comment })),
    ).toEqual({
      type: 'comment-created',
      comment,
    });
  });
});
