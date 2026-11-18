import { CommentJobConsumer } from './comment-job.consumer';

describe('CommentJobConsumer', () => {
  it('deserializes the payload and runs the processor', async () => {
    const processor = { handle: jest.fn().mockResolvedValue(undefined) };
    const consumer = new CommentJobConsumer(processor as never);
    const buffer = Buffer.from('png');

    await consumer.handle({
      type: 'process-image',
      commentId: 'comment-1',
      fileName: 'photo.png',
      bufferBase64: buffer.toString('base64'),
    });

    expect(processor.handle).toHaveBeenCalledWith({
      type: 'process-image',
      commentId: 'comment-1',
      fileName: 'photo.png',
      buffer,
    });
  });
});
