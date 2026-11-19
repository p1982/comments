import { IsNull } from 'typeorm';

import { OutboxRepository } from './outbox.repository';
import { OutboxEventsEntity } from '../entity/outbox.entity';

describe('OutboxRepository', () => {
  const find = jest.fn();
  const update = jest.fn();
  const createQueryBuilder = jest.fn();
  const outboxEventsRepository = {
    find,
    update,
    createQueryBuilder,
  };
  const repository = new OutboxRepository(outboxEventsRepository as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds pending events ordered by createdAt', async () => {
    const pending = [{ id: 'o1' }];
    find.mockResolvedValue(pending);

    await expect(repository.findPending(20)).resolves.toBe(pending);
    expect(find).toHaveBeenCalledWith({
      where: { processedAt: IsNull() },
      order: { createdAt: 'ASC', id: 'ASC' },
      take: 20,
    });
  });

  it('marks an event as processed', async () => {
    update.mockResolvedValue(undefined);

    await repository.markProcessed('o1');

    expect(update).toHaveBeenCalledWith(
      { id: 'o1' },
      { processedAt: expect.any(Date), errorMessage: null },
    );
  });

  it('marks an event as failed and increments attempts', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    const where = jest.fn().mockReturnValue({ execute });
    const set = jest.fn().mockReturnValue({ where });
    const qbUpdate = jest.fn().mockReturnValue({ set });
    createQueryBuilder.mockReturnValue({ update: qbUpdate });

    await repository.markFailed('o1', 'x'.repeat(120));

    expect(createQueryBuilder).toHaveBeenCalled();
    expect(qbUpdate).toHaveBeenCalledWith(OutboxEventsEntity);
    expect(set).toHaveBeenCalledWith({
      attempts: expect.any(Function),
      errorMessage: 'x'.repeat(100),
    });
    expect(where).toHaveBeenCalledWith('id = :id', { id: 'o1' });
    expect(execute).toHaveBeenCalled();
  });

  it('inserts an event inside the transaction manager', async () => {
    const create = jest.fn((value: object) => value);
    const save = jest.fn((value: { id?: string }) => Promise.resolve({ ...value, id: 'o1' }));
    const findOne = jest.fn().mockResolvedValue({ id: 'o1', eventType: 'comment.created' });
    const manager = {
      getRepository: jest.fn(() => ({ create, save, findOne })),
    };

    const saved = await repository.insert(
      {
        aggregateType: 'comment',
        aggregatedId: 'c1',
        eventType: 'comment.created',
        payload: { comment: { id: 'c1' } },
      },
      manager as never,
    );

    expect(manager.getRepository).toHaveBeenCalledWith(OutboxEventsEntity);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        aggregateType: 'comment',
        aggregatedId: 'c1',
        eventType: 'comment.created',
        attempts: 0,
        errorMessage: null,
        processedAt: null,
      }),
    );
    expect(save).toHaveBeenCalled();
    expect(findOne).toHaveBeenCalledWith({ where: { id: 'o1' } });
    expect(saved).toEqual({ id: 'o1', eventType: 'comment.created' });
  });

  it('returns the saved row when reload finds nothing', async () => {
    const created = {
      aggregateType: 'comment',
      aggregatedId: 'c1',
      eventType: 'comment.created',
      payload: '{}',
      attempts: 0,
      errorMessage: null,
      processedAt: null,
    };
    const create = jest.fn(() => created);
    const save = jest.fn(() => Promise.resolve({ ...created, id: 'o2' }));
    const findOne = jest.fn().mockResolvedValue(null);
    const manager = {
      getRepository: jest.fn(() => ({ create, save, findOne })),
    };

    await expect(
      repository.insert(
        {
          aggregateType: 'comment',
          aggregatedId: 'c1',
          eventType: 'comment.created',
          payload: {},
        },
        manager as never,
      ),
    ).resolves.toEqual({ ...created, id: 'o2' });
  });
});
