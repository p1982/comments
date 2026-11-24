import { In, type EntityManager, type Repository } from 'typeorm';

import type { CommentVotesEntity } from '../entity/comment-votes.entity';
import { CommentVotesRepository } from './comment-votes.repository';

describe('CommentVotesRepository', () => {
  const repo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data: Partial<CommentVotesEntity>) => data),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn(() => repo),
  } as unknown as EntityManager;

  const votes = new CommentVotesRepository(repo as unknown as Repository<CommentVotesEntity>);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('short-circuits user votes lookup when ids or voterKey are empty', async () => {
    await expect(votes.findUserVotesByCommentIds([], 'user:1')).resolves.toEqual(new Map());
    await expect(votes.findUserVotesByCommentIds(['c1'], null)).resolves.toEqual(new Map());
    expect(repo.find).not.toHaveBeenCalled();
  });

  it('loads and normalizes user votes for a set of comments', async () => {
    repo.find.mockResolvedValue([
      { commentId: 'c1', value: 1 },
      { commentId: 'c2', value: -1 },
      { commentId: 'c3', value: 0 },
    ]);

    const result = await votes.findUserVotesByCommentIds(['c1', 'c2', 'c3'], 'user:1');

    expect(repo.find).toHaveBeenCalledWith({
      where: { commentId: In(['c1', 'c2', 'c3']), voterKey: 'user:1' },
      select: { commentId: true, value: true },
    });
    expect(result).toEqual(
      new Map([
        ['c1', 1],
        ['c2', -1],
        ['c3', 0],
      ]),
    );
  });

  it('inserts a new vote when no previous vote exists', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.save.mockResolvedValue({ id: 'v1', commentId: 'c1', voterKey: 'user:1', value: 1 });

    await expect(votes.toggleVote('c1', 'user:1', 1, manager)).resolves.toEqual({
      delta: 1,
      userVote: 1,
    });
    expect(repo.create).toHaveBeenCalledWith({ commentId: 'c1', voterKey: 'user:1', value: 1 });
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('removes an existing vote when clicking the same direction again', async () => {
    repo.findOne.mockResolvedValue({ id: 'v1', commentId: 'c1', voterKey: 'user:1', value: 1 });
    repo.delete.mockResolvedValue({ affected: 1 });

    await expect(votes.toggleVote('c1', 'user:1', 1, manager)).resolves.toEqual({
      delta: -1,
      userVote: 0,
    });
    expect(repo.delete).toHaveBeenCalledWith({ id: 'v1' });
  });

  it('switches vote direction and returns a delta of 2 or -2', async () => {
    const existing = { id: 'v1', commentId: 'c1', voterKey: 'user:1', value: 1 };
    repo.findOne.mockResolvedValue(existing);
    repo.save.mockResolvedValue({ ...existing, value: -1 });

    await expect(votes.toggleVote('c1', 'user:1', -1, manager)).resolves.toEqual({
      delta: -2,
      userVote: -1,
    });
    expect(existing.value).toBe(-1);
    expect(repo.save).toHaveBeenCalledWith(existing);
  });
});
