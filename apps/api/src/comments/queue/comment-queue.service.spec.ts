import type { CommentJob } from './comment-job';
import { CommentQueueService } from './comment-queue.service';

describe('CommentQueueService', () => {
  it('processes enqueued jobs in order', async () => {
    const handled: Array<CommentJob['type']> = [];
    const processor = {
      handle: jest.fn((job: CommentJob) => {
        handled.push(job.type);
        return Promise.resolve();
      }),
    };
    const queue = new CommentQueueService(processor as never);

    queue.enqueue({
      type: 'process-image',
      commentId: 'comment-1',
      fileName: 'photo.png',
      buffer: Buffer.from('x'),
    });
    queue.enqueue({
      type: 'comment-created',
      comment: {
        id: 'comment-1',
        text: 'Hello',
        createdAt: '2026-01-01T00:00:00.000Z',
        fullName: 'Ann',
        email: 'ann@example.com',
        homepage: '',
        parentId: null,
        attachments: [],
      },
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(processor.handle).toHaveBeenCalledTimes(2);
    expect(handled).toEqual(['process-image', 'comment-created']);
  });
});
