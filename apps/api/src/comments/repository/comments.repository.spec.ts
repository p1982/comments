import { IsNull, Not, type EntityManager, type Repository } from 'typeorm';

import type { CommentsEntity } from '../entity/comments.entity';
import { CommentsRepository } from './comments.repository';

describe('CommentsRepository', () => {
  const repo = {
    find: jest.fn(),
    findAndCount: jest.fn(),
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

  it('lists roots with the default page size', async () => {
    repo.findAndCount.mockResolvedValue([[], 0]);

    await expect(
      comments.findAll({ page: 1, limit: 25, sort: 'createdAt', order: 'desc' }),
    ).resolves.toEqual([[], 0]);
    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { parentId: IsNull() },
        relations: { user: true, attachments: true },
        skip: 0,
        take: 25,
        order: { createdAt: 'DESC', id: 'DESC' },
      }),
    );
  });

  it('uses the requested limit and page', async () => {
    repo.findAndCount.mockResolvedValue([[], 0]);

    await comments.findAll({ page: 2, limit: 10, sort: 'createdAt', order: 'desc' });

    expect(repo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
  });

  it('sorts by name or email in the requested direction', async () => {
    repo.findAndCount.mockResolvedValue([[], 0]);

    await comments.findAll({ page: 1, limit: 25, sort: 'fullName', order: 'asc' });
    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { user: { fullName: 'ASC' }, createdAt: 'ASC', id: 'ASC' },
      }),
    );

    await comments.findAll({ page: 1, limit: 25, sort: 'email', order: 'desc' });
    expect(repo.findAndCount).toHaveBeenLastCalledWith(
      expect.objectContaining({
        order: { user: { email: 'DESC' }, createdAt: 'DESC', id: 'DESC' },
      }),
    );
  });

  it('loads a thread by root id', async () => {
    repo.find.mockResolvedValue([]);

    await expect(comments.findByRootId('root-1')).resolves.toEqual([]);
    expect(repo.find).toHaveBeenCalledWith({
      where: { rootId: 'root-1', parentId: Not(IsNull()) },
      relations: { user: true, attachments: true },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  });

  it('finds a comment by id', async () => {
    const comment = { id: '1' } as CommentsEntity;
    repo.findOne.mockResolvedValue(comment);

    await expect(comments.findById('1')).resolves.toBe(comment);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
      relations: { user: true, attachments: true },
    });
  });

  it('saves a comment through the transaction manager', async () => {
    const saved = { id: '1' } as CommentsEntity;
    repo.save.mockResolvedValue(saved);
    repo.findOne.mockResolvedValue(saved);

    await expect(comments.create(data, manager)).resolves.toBe(saved);
    expect(repo.create).toHaveBeenCalledWith(data);
    expect(repo.save).toHaveBeenCalledWith(data);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: saved.id },
      relations: { attachments: true },
    });
  });

  it('returns the saved comment when reload finds nothing', async () => {
    const saved = { id: '1' } as CommentsEntity;
    repo.save.mockResolvedValue(saved);
    repo.findOne.mockResolvedValue(null);

    await expect(comments.create(data, manager)).resolves.toBe(saved);
  });
});
