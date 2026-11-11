import type { EntityManager, Repository } from 'typeorm';

import type { UsersEntity } from '../entity/users.entity';
import { UsersRepository } from './users.repository';

describe('UsersRepository', () => {
  const repo = {
    findOne: jest.fn(),
    create: jest.fn((data: Partial<UsersEntity>) => data),
    save: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn(() => repo),
  } as unknown as EntityManager;
  const users = new UsersRepository(repo as unknown as Repository<UsersEntity>);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds a user by normalized email', async () => {
    const user = { id: '1' } as UsersEntity;
    repo.findOne.mockResolvedValue(user);

    await expect(users.findByEmail('  Foo@Mail.com ')).resolves.toBe(user);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { email: 'foo@mail.com' },
      relations: { comments: true },
    });
  });

  it('finds a user by id', async () => {
    const user = { id: '1' } as UsersEntity;
    repo.findOne.mockResolvedValue(user);

    await expect(users.findById('1')).resolves.toBe(user);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
      relations: { comments: true },
    });
  });

  it('returns the reloaded user after create', async () => {
    const saved = { id: '1', email: 'a@b.c' } as UsersEntity;
    const reloaded = { id: '1', email: 'a@b.c', fullName: 'Ann' } as UsersEntity;
    repo.save.mockResolvedValue(saved);
    repo.findOne.mockResolvedValue(reloaded);

    await expect(
      users.create(
        { email: '  A@B.C ', fullName: 'Ann', homepage: 'https://example.com' },
        manager,
      ),
    ).resolves.toBe(reloaded);
    expect(repo.create).toHaveBeenCalledWith({
      email: 'a@b.c',
      fullName: 'Ann',
      homepage: 'https://example.com',
    });
  });

  it('returns the saved user when reload finds nothing', async () => {
    const saved = { id: '1', email: 'a@b.c' } as UsersEntity;
    repo.save.mockResolvedValue(saved);
    repo.findOne.mockResolvedValue(null);

    await expect(users.create({ email: 'a@b.c', fullName: 'Ann' }, manager)).resolves.toBe(saved);
  });
});
