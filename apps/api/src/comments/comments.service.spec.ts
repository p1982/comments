jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
}));

import { createHmac } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import sharp from 'sharp';
import type { EntityManager } from 'typeorm';

import type { UsersEntity } from '@app/users/entity/users.entity';

import { CommentsService } from './comments.service';

const captchaSecret = 'test-captcha-secret';
const captcha = 'AB12C';
const captchaToken = createHmac('sha256', captchaSecret)
  .update(captcha.toLowerCase())
  .digest('hex');

describe('CommentsService', () => {
  const commentsInTransaction = { findOne: jest.fn() };
  const manager = {
    getRepository: jest.fn(() => commentsInTransaction),
  } as unknown as EntityManager;
  const dataSource = {
    transaction: jest.fn(async (callback: (current: EntityManager) => Promise<unknown>) => {
      return await callback(manager);
    }),
  };
  const usersRepository = { create: jest.fn(), findByEmail: jest.fn() };
  const commentsRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findByRootId: jest.fn(),
  };
  const configService = { getOrThrow: jest.fn(() => captchaSecret) };
  const attachmentsRepository = { create: jest.fn() };
  const service = new CommentsService(
    dataSource as never,
    usersRepository as never,
    commentsRepository as never,
    configService as never,
    attachmentsRepository as never,
  );
  const comment = {
    fullName: 'Ann',
    email: 'ann@example.com',
    homepage: 'https://ann.example',
    text: 'Hello',
    captcha,
  };
  const savedComment = {
    id: '11111111-1111-1111-1111-111111111111' as const,
    rootId: '11111111-1111-1111-1111-111111111111' as const,
    parentId: null,
    userId: 'user-1',
    text: 'Hello',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    attachments: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    dataSource.transaction.mockImplementation(async (callback) => {
      return await callback(manager);
    });
    commentsInTransaction.findOne.mockResolvedValue(savedComment);
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

    await expect(service.createComment(comment, captchaToken, null)).resolves.toEqual({
      id: savedComment.id,
      text: 'Hello',
      createdAt: '2026-01-01T00:00:00.000Z',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: 'https://ann.example',
      parentId: null,
      attachments: [],
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

    await service.createComment(comment, captchaToken, null);

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

    await service.createComment({ ...comment, homepage: undefined }, captchaToken, null);

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

    await service.createComment({ ...comment, homepage: undefined }, captchaToken, savedUser);

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

    await service.createComment({ ...comment, parentId: rootId }, captchaToken, savedUser);

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

    await service.createComment({ ...comment, parentId: replyId }, captchaToken, savedUser);

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

    await expect(
      service.createComment({ ...comment, parentId }, captchaToken, savedUser),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(commentsRepository.findById).toHaveBeenCalledWith(parentId);
    expect(commentsRepository.create).not.toHaveBeenCalled();
    expect(usersRepository.create).not.toHaveBeenCalled();
  });

  it('maps listed comments through the comment response', async () => {
    const savedUser = {
      id: 'user-1',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: 'https://ann.example',
    } as UsersEntity;
    commentsRepository.findAll.mockResolvedValue([[{ ...savedComment, user: savedUser }], 1]);

    await expect(
      service.getComments({ page: 1, limit: 25, sort: 'createdAt', order: 'desc' }),
    ).resolves.toEqual({
      data: [
        {
          id: savedComment.id,
          text: 'Hello',
          createdAt: '2026-01-01T00:00:00.000Z',
          fullName: 'Ann',
          email: 'ann@example.com',
          homepage: 'https://ann.example',
          parentId: null,
          attachments: [],
        },
      ],
      total: 1,
      totalPages: 1,
      status: 'success',
      message: 'Comments fetched successfully',
    });
  });

  it('returns children of a root comment', async () => {
    const savedUser = {
      id: 'user-1',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: 'https://ann.example',
    } as UsersEntity;
    const child = {
      ...savedComment,
      id: '33333333-3333-3333-3333-333333333333',
      parentId: savedComment.id,
      user: savedUser,
    };
    commentsRepository.findById.mockResolvedValue(savedComment);
    commentsRepository.findByRootId.mockResolvedValue([child]);

    await expect(service.getCommentsByRootId(savedComment.id)).resolves.toEqual({
      data: [
        {
          id: child.id,
          text: 'Hello',
          createdAt: '2026-01-01T00:00:00.000Z',
          fullName: 'Ann',
          email: 'ann@example.com',
          homepage: 'https://ann.example',
          parentId: savedComment.id,
          attachments: [],
        },
      ],
      status: 'success',
      message: 'Comments fetched successfully',
    });
    expect(commentsRepository.findByRootId).toHaveBeenCalledWith(savedComment.id);
  });

  it('rejects a children lookup when the root comment does not exist', async () => {
    commentsRepository.findById.mockResolvedValue(null);

    await expect(service.getCommentsByRootId(savedComment.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(commentsRepository.findByRootId).not.toHaveBeenCalled();
  });

  it('turns a failed children lookup into an internal server error', async () => {
    commentsRepository.findById.mockResolvedValue(savedComment);
    commentsRepository.findByRootId.mockRejectedValue(new Error('db down'));

    await expect(service.getCommentsByRootId(savedComment.id)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('turns a failed list into an internal server error', async () => {
    commentsRepository.findAll.mockRejectedValue(new Error('db down'));

    await expect(
      service.getComments({ page: 1, limit: 25, sort: 'createdAt', order: 'desc' }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('rejects a comment when the captcha cookie does not match', async () => {
    await expect(service.createComment(comment, 'not-the-hmac', null)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('turns a failed transaction into an internal server error', async () => {
    dataSource.transaction.mockRejectedValueOnce(new Error('db down'));

    await expect(service.createComment(comment, captchaToken, null)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('writes a fitted image into assets', async () => {
    const savedUser = {
      id: 'user-1',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: 'https://ann.example',
    } as UsersEntity;
    usersRepository.create.mockResolvedValue(savedUser);
    commentsRepository.create.mockResolvedValue(savedComment);
    const png = await sharp({
      create: { width: 10, height: 10, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();

    await service.createComment(comment, captchaToken, null, {
      buffer: png,
      originalname: 'photo.png',
    } as Express.Multer.File);

    expect(mkdir).toHaveBeenCalledWith(expect.stringMatching(/apps\/api\/assets$/), {
      recursive: true,
    });
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`apps/api/assets/${savedComment.id}\\.png$`)),
      expect.any(Buffer),
    );
    expect(attachmentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        storageKey: `${savedComment.id}.png`,
        fileName: 'photo.png',
        mimeType: 'image/png',
      }),
      manager,
    );
  });

  it('stores a text file of 100 KB', async () => {
    const savedUser = {
      id: 'user-1',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: 'https://ann.example',
    } as UsersEntity;
    usersRepository.create.mockResolvedValue(savedUser);
    commentsRepository.create.mockResolvedValue(savedComment);
    const text = Buffer.alloc(100 * 1024, 0x61);

    await service.createComment(comment, captchaToken, null, undefined, {
      buffer: text,
      originalname: 'note.txt',
    } as Express.Multer.File);

    expect(writeFile).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`apps/api/assets/${savedComment.id}\\.txt$`)),
      text,
    );
    expect(attachmentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        storageKey: `${savedComment.id}.txt`,
        file_type: 'text',
        mimeType: 'text/plain',
        fileSize: 100 * 1024,
      }),
      manager,
    );
  });

  it('rejects a text file larger than 100 KB before writing it', async () => {
    const savedUser = {
      id: 'user-1',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: 'https://ann.example',
    } as UsersEntity;
    usersRepository.create.mockResolvedValue(savedUser);
    commentsRepository.create.mockResolvedValue(savedComment);

    await expect(
      service.createComment(comment, captchaToken, null, undefined, {
        buffer: Buffer.alloc(100 * 1024 + 1, 0x61),
        originalname: 'big.txt',
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(writeFile).not.toHaveBeenCalled();
    expect(attachmentsRepository.create).not.toHaveBeenCalled();
  });

  it('creates a comment without a text file attachment', async () => {
    const savedUser = {
      id: 'user-1',
      fullName: 'Ann',
      email: 'ann@example.com',
      homepage: 'https://ann.example',
    } as UsersEntity;
    usersRepository.create.mockResolvedValue(savedUser);
    commentsRepository.create.mockResolvedValue(savedComment);

    await service.createComment(comment, captchaToken, null);

    expect(writeFile).not.toHaveBeenCalled();
    expect(attachmentsRepository.create).not.toHaveBeenCalled();
  });
});
