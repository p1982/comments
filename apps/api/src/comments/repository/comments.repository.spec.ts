import { IsNull, Not, type EntityManager, type Repository } from 'typeorm';

import type { CommentsEntity } from '../entity/comments.entity';
import { CommentsRepository } from './comments.repository';

describe('CommentsRepository', () => {
  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getRawMany: jest.fn(),
  };
  const repo = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data: Partial<CommentsEntity>) => data),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilder),
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

  it('finds comments by ids in requested order and short-circuits empty lists', async () => {
    await expect(comments.findByIds([])).resolves.toEqual([]);
    expect(repo.find).not.toHaveBeenCalled();

    const c1 = { id: 'c1' } as CommentsEntity;
    const c2 = { id: 'c2' } as CommentsEntity;
    repo.find.mockResolvedValue([c1, c2]);

    await expect(comments.findByIds(['c2', 'missing', 'c1'])).resolves.toEqual([c2, c1]);
  });

  it('searches comments in PostgreSQL by escaped ILIKE substring pattern', async () => {
    const match = { id: 'c1' } as CommentsEntity;
    queryBuilder.getManyAndCount.mockResolvedValue([[match], 1]);

    await expect(comments.searchByText('80_00%14\\', 2, 10)).resolves.toEqual([[match], 1]);

    expect(repo.createQueryBuilder).toHaveBeenCalledWith('comment');
    expect(queryBuilder.where).toHaveBeenCalledWith(expect.stringContaining('ILIKE :pattern'), {
      pattern: '%80\\_00\\%14\\\\%',
    });
    expect(queryBuilder.skip).toHaveBeenCalledWith(10);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
  });

  it('loads ordered comment batches for search reindexing', async () => {
    const batch = [{ id: 'c1' } as CommentsEntity];
    repo.find.mockResolvedValue(batch);

    await expect(comments.findBatchForIndex(500, 500)).resolves.toEqual(batch);
    expect(repo.find).toHaveBeenCalledWith({
      relations: { user: true },
      order: { createdAt: 'ASC', id: 'ASC' },
      skip: 500,
      take: 500,
    });
  });

  it('counts replies grouped by root id and short-circuits empty input', async () => {
    await expect(comments.countRepliesByRootIds([])).resolves.toEqual(new Map());
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();

    queryBuilder.getRawMany.mockResolvedValue([
      { rootId: 'r1', count: '5' },
      { rootId: 'r2', count: '12' },
    ]);

    await expect(comments.countRepliesByRootIds(['r1', 'r2'])).resolves.toEqual(
      new Map([
        ['r1', 5],
        ['r2', 12],
      ]),
    );
    expect(queryBuilder.where).toHaveBeenCalledWith('comment.rootId IN (:...rootIds)', {
      rootIds: ['r1', 'r2'],
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('comment.parentId IS NOT NULL');
    expect(queryBuilder.groupBy).toHaveBeenCalledWith('comment.rootId');
  });
});
