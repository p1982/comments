import { Logger } from '@nestjs/common';

import { COMMENT_CREATED } from '@app/comments/comments.constants';
import { CommentCreatedEvent } from '@app/comments/events/comment-created.event';

import { OutboxPublisherService } from './outbox-publisher.service';

describe('OutboxPublisherService', () => {
  const outboxRepository = {
    findPending: jest.fn(),
    markProcessed: jest.fn(),
    markFailed: jest.fn(),
  };
  const events = { emit: jest.fn() };
  const service = new OutboxPublisherService(outboxRepository as never, events as never);
  const tick = () => (service as unknown as { tick: () => Promise<void> }).tick();

  const comment = {
    id: '11111111-1111-1111-1111-111111111111',
    text: 'Hello',
    createdAt: '2026-01-01T00:00:00.000Z',
    fullName: 'Ann',
    email: 'ann@example.com',
    homepage: 'https://ann.example',
    parentId: null,
    attachments: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    outboxRepository.findPending.mockResolvedValue([]);
    outboxRepository.markProcessed.mockResolvedValue(undefined);
    outboxRepository.markFailed.mockResolvedValue(undefined);
  });

  it('starts and stops the polling timer', () => {
    jest.useFakeTimers();
    const setSpy = jest.spyOn(global, 'setInterval');
    const clearSpy = jest.spyOn(global, 'clearInterval');

    service.onModuleInit();
    expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

    service.onModuleDestroy();
    expect(clearSpy).toHaveBeenCalled();

    setSpy.mockRestore();
    clearSpy.mockRestore();
    jest.useRealTimers();
  });

  it('returns early when there are no pending events', async () => {
    await tick();
    expect(events.emit).not.toHaveBeenCalled();
    expect(outboxRepository.markProcessed).not.toHaveBeenCalled();
  });

  it('emits comment.created and marks the outbox row processed', async () => {
    outboxRepository.findPending.mockResolvedValue([
      {
        id: 'o1',
        eventType: 'comment.created',
        aggregatedId: comment.id,
        payload: { comment },
      },
    ]);

    await tick();

    expect(events.emit).toHaveBeenCalledWith(COMMENT_CREATED, expect.any(CommentCreatedEvent));
    const event = events.emit.mock.calls[0]?.[1] as CommentCreatedEvent;
    expect(event.comment).toEqual(comment);
    expect(outboxRepository.markProcessed).toHaveBeenCalledWith('o1');
  });

  it('marks unknown event types processed without emitting', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    outboxRepository.findPending.mockResolvedValue([
      {
        id: 'o2',
        eventType: 'other.event',
        aggregatedId: comment.id,
        payload: {},
      },
    ]);

    await tick();

    expect(events.emit).not.toHaveBeenCalled();
    expect(outboxRepository.markProcessed).toHaveBeenCalledWith('o2');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('marks the event failed when emit throws', async () => {
    outboxRepository.findPending.mockResolvedValue([
      {
        id: 'o3',
        eventType: 'comment.created',
        aggregatedId: comment.id,
        payload: { comment },
      },
    ]);
    events.emit.mockImplementation(() => {
      throw new Error('boom');
    });

    await tick();

    expect(outboxRepository.markFailed).toHaveBeenCalledWith('o3', 'boom');
    expect(outboxRepository.markProcessed).not.toHaveBeenCalled();
  });

  it('skips overlapping ticks while one is already running', async () => {
    let resolvePending: ((value: never[]) => void) | undefined;
    outboxRepository.findPending.mockImplementation(
      () =>
        new Promise<never[]>((resolve) => {
          resolvePending = resolve;
        }),
    );

    const first = tick();
    const second = tick();
    resolvePending?.([]);
    await Promise.all([first, second]);

    expect(outboxRepository.findPending).toHaveBeenCalledTimes(1);
  });
});
