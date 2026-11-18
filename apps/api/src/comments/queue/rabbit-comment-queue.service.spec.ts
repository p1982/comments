import { COMMENT_QUEUE_NAME } from './comment-job';
import { RabbitCommentQueueService } from './rabbit-comment-queue.service';

describe('RabbitCommentQueueService', () => {
  it('serializes the job and emits it to Rabbit', () => {
    const client = { emit: jest.fn() };
    const queue = new RabbitCommentQueueService(client as never);
    const buffer = Buffer.from('png');

    queue.enqueue({
      type: 'process-image',
      commentId: 'comment-1',
      fileName: 'photo.png',
      buffer,
    });

    expect(client.emit).toHaveBeenCalledWith(COMMENT_QUEUE_NAME, {
      type: 'process-image',
      commentId: 'comment-1',
      fileName: 'photo.png',
      bufferBase64: buffer.toString('base64'),
    });
  });
});
