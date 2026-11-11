import { InternalServerErrorException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';

import type { UsersEntity } from '@app/users/entity/users.entity';

import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  const manager = { id: 'manager' } as unknown as EntityManager;
  const dataSource = {
    transaction: jest.fn(async (callback: (current: EntityManager) => Promise<unknown>) => {
      return await callback(manager);
    }),
  };
  const usersRepository = { create: jest.fn() };
  const commentsRepository = { create: jest.fn() };
  const service = new CommentsService(
    dataSource as never,
    usersRepository as never,
    commentsRepository as never,
  );
  const comment = {
    fullName: 'Ann',
    email: 'ann@example.com',
    homepage: 'https://ann.example',
    text: 'Hello',
  };
  const savedComment = {
    id: '11111111-1111-1111-1111-111111111111' as const,
    rootId: '11111111-1111-1111-1111-111111111111' as const,
    parentId: null,
    userId: 'user-1',
    text: 'Hello',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    dataSource.transaction.mockImplementation(async (callback) => {
      return await callback(manager);
    });
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(savedComment.id);
  });

  it('creates a user inside the transaction when the request has none', async () => {
    const savedUser = {
      id: 'user-1',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: 'https://ann.example',
    } as UsersEntity;
    usersRepository.create.mockResolvedValue(savedUser);
    commentsRepository.create.mockResolvedValue(savedComment);

    await expect(service.createComment(comment, null)).resolves.toEqual({
      id: savedComment.id,
      text: 'Hello',
      createdAt: '2026-01-01T00:00:00.000Z',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: 'https://ann.example',
      parentId: null,
    });
    expect(usersRepository.create).toHaveBeenCalledWith(
      {
        email: 'ann@example.com',
        fullName: 'Ann',
        homepage: 'https://ann.example',
      },
      manager,
    );
  });

  it('keeps the signed-in user and stores an empty homepage', async () => {
    const savedUser = {
      id: 'user-1',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: '',
    } as UsersEntity;
    commentsRepository.create.mockResolvedValue(savedComment);

    await service.createComment({ ...comment, homepage: undefined }, savedUser);

    expect(usersRepository.create).not.toHaveBeenCalled();
    expect(commentsRepository.create).toHaveBeenCalledWith(
      {
        id: savedComment.id,
        rootId: savedComment.id,
        parentId: null,
        userId: 'user-1',
        text: 'Hello',
      },
      manager,
    );
  });

  it('turns a failed transaction into an internal server error', async () => {
    dataSource.transaction.mockRejectedValueOnce(new Error('db down'));

    await expect(service.createComment(comment, null)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
