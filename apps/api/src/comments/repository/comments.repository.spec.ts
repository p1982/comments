import type { EntityManager, Repository } from 'typeorm';

import type { CommentsEntity } from '../entity/comments.entity';
import { CommentsRepository } from './comments.repository';

describe('CommentsRepository', () => {
  const repo = {
    findOne: jest.fn(),
    create: jest.fn((data: Partial<CommentsEntity>) => data),
    save: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn(() => repo),
  } as unknown as EntityManager;
  const comments = new CommentsRepository(repo as unknown as Repository<CommentsEntity>);
  const data = {
    id: '1',
    rootId: '1',
    parentId: null,
    userId: 'user-1',
    text: 'Hello',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds a comment by id', async () => {
    const comment = { id: '1' } as CommentsEntity;
    repo.findOne.mockResolvedValue(comment);

    await expect(comments.findById('1')).resolves.toBe(comment);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('saves a comment through the transaction manager', async () => {
    const saved = { id: '1' } as CommentsEntity;
    repo.save.mockResolvedValue(saved);
    repo.findOne.mockResolvedValue(saved);

    await expect(comments.create(data, manager)).resolves.toBe(saved);
    expect(repo.create).toHaveBeenCalledWith(data);
    expect(repo.save).toHaveBeenCalledWith(data);
  });

  it('returns the saved comment when reload finds nothing', async () => {
    const saved = { id: '1' } as CommentsEntity;
    repo.save.mockResolvedValue(saved);
    repo.findOne.mockResolvedValue(null);

    await expect(comments.create(data, manager)).resolves.toBe(saved);
  });
});
