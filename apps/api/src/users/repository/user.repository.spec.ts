import type { Repository } from 'typeorm';

import type { UserEntity } from '../entity/user.entity';
import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  const repo = {
    findOne: jest.fn(),
    create: jest.fn((data: Partial<UserEntity>) => data),
    save: jest.fn(),
  };
  const users = new UserRepository(repo as unknown as Repository<UserEntity>);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds a user by normalized email', async () => {
    const user = { id: '1' } as UserEntity;
    repo.findOne.mockResolvedValue(user);

    await expect(users.findByEmail('  Foo@Mail.com ')).resolves.toBe(user);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { email: 'foo@mail.com' },
      relations: { comments: true },
    });
  });

  it('finds a user by id', async () => {
    const user = { id: '1' } as UserEntity;
    repo.findOne.mockResolvedValue(user);

    await expect(users.findById('1')).resolves.toBe(user);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
      relations: { comments: true },
    });
  });

  it('returns the reloaded user after create', async () => {
    const saved = { id: '1', email: 'a@b.c' } as UserEntity;
    const reloaded = { id: '1', email: 'a@b.c', fullName: 'Ann' } as UserEntity;
    repo.save.mockResolvedValue(saved);
    repo.findOne.mockResolvedValue(reloaded);

    await expect(
      users.create({ email: '  A@B.C ', fullname: 'Ann', homepage: 'https://example.com' }),
    ).resolves.toBe(reloaded);
    expect(repo.create).toHaveBeenCalledWith({
      email: 'a@b.c',
      fullname: 'Ann',
      homepage: 'https://example.com',
    });
  });

  it('returns the saved user when reload finds nothing', async () => {
    const saved = { id: '1', email: 'a@b.c' } as UserEntity;
    repo.save.mockResolvedValue(saved);
    repo.findOne.mockResolvedValue(null);

    await expect(users.create({ email: 'a@b.c', fullname: 'Ann' })).resolves.toBe(saved);
  });
});
