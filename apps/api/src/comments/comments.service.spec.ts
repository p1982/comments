import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
  const usersRepository = { create: jest.fn(), findByEmail: jest.fn() };
  const commentsRepository = { create: jest.fn(), findById: jest.fn() };
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
    usersRepository.findByEmail.mockResolvedValue(null);
  });

  it('creates a user inside the transaction when the email is unknown', async () => {
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
    expect(usersRepository.findByEmail).toHaveBeenCalledWith('ann@example.com');
    expect(usersRepository.create).toHaveBeenCalledWith(
      {
        email: 'ann@example.com',
        fullName: 'Ann',
        homepage: 'https://ann.example',
      },
      manager,
    );
  });

  it('reuses the user found by email', async () => {
    const existingUser = {
      id: 'user-9',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: 'https://ann.example',
    } as UsersEntity;
    usersRepository.findByEmail.mockResolvedValue(existingUser);
    commentsRepository.create.mockResolvedValue({ ...savedComment, userId: 'user-9' });

    await service.createComment(comment, null);

    expect(usersRepository.create).not.toHaveBeenCalled();
    expect(commentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-9' }),
      manager,
    );
  });

  it('stores an empty homepage when the form omits it', async () => {
    const savedUser = {
      id: 'user-1',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: '',
    } as UsersEntity;
    usersRepository.create.mockResolvedValue(savedUser);
    commentsRepository.create.mockResolvedValue(savedComment);

    await service.createComment({ ...comment, homepage: undefined }, null);

    expect(usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ homepage: '' }),
      manager,
    );
  });

  it('keeps the signed-in user', async () => {
    const savedUser = {
      id: 'user-1',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: '',
    } as UsersEntity;
    commentsRepository.create.mockResolvedValue(savedComment);

    await service.createComment({ ...comment, homepage: undefined }, savedUser);

    expect(usersRepository.findByEmail).toHaveBeenCalledWith('ann@example.com');
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

  it('replies to a root comment and keeps that root id', async () => {
    const rootId = '22222222-2222-2222-2222-222222222222' as const;
    const savedUser = {
      id: 'user-1',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: 'https://ann.example',
    } as UsersEntity;
    commentsRepository.findById.mockResolvedValue({
      id: rootId,
      rootId,
      parentId: null,
    });
    commentsRepository.create.mockResolvedValue({
      ...savedComment,
      parentId: rootId,
      rootId,
    });

    await service.createComment({ ...comment, parentId: rootId }, savedUser);

    expect(commentsRepository.findById).toHaveBeenCalledWith(rootId);
    expect(commentsRepository.create).toHaveBeenCalledWith(
      {
        id: savedComment.id,
        rootId,
        parentId: rootId,
        userId: 'user-1',
        text: 'Hello',
      },
      manager,
    );
  });

  it('replies to a reply and keeps the original root id', async () => {
    const rootId = '22222222-2222-2222-2222-222222222222' as const;
    const replyId = '33333333-3333-3333-3333-333333333333' as const;
    const savedUser = {
      id: 'user-1',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: 'https://ann.example',
    } as UsersEntity;
    commentsRepository.findById.mockResolvedValue({
      id: replyId,
      rootId,
      parentId: rootId,
    });
    commentsRepository.create.mockResolvedValue({
      ...savedComment,
      parentId: replyId,
      rootId,
    });

    await service.createComment({ ...comment, parentId: replyId }, savedUser);

    expect(commentsRepository.create).toHaveBeenCalledWith(
      {
        id: savedComment.id,
        rootId,
        parentId: replyId,
        userId: 'user-1',
        text: 'Hello',
      },
      manager,
    );
  });

  it('rejects a reply when the parent comment does not exist', async () => {
    const parentId = '44444444-4444-4444-4444-444444444444';
    const savedUser = {
      id: 'user-1',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: 'https://ann.example',
    } as UsersEntity;
    commentsRepository.findById.mockResolvedValue(null);

    await expect(service.createComment({ ...comment, parentId }, savedUser)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(commentsRepository.findById).toHaveBeenCalledWith(parentId);
    expect(commentsRepository.create).not.toHaveBeenCalled();
    expect(usersRepository.create).not.toHaveBeenCalled();
  });

  it('turns a failed transaction into an internal server error', async () => {
    dataSource.transaction.mockRejectedValueOnce(new Error('db down'));

    await expect(service.createComment(comment, null)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
