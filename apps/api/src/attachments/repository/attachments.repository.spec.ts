import type { EntityManager } from 'typeorm';

import { AttachmentsRepository, type CreateAttachmentData } from './attachments.repository';

describe('AttachmentsRepository', () => {
  const file: CreateAttachmentData = {
    id: 'attachment-1',
    commentId: 'comment-1',
    fileName: 'photo.png',
    file_type: 'image',
    mimeType: 'image/png',
    fileSize: 12,
    storageKey: 'attachment-1.png',
  };
  const repo = {
    create: jest.fn((data: CreateAttachmentData) => data),
    save: jest.fn((entity: CreateAttachmentData) => Promise.resolve(entity)),
    findOne: jest.fn(),
  };
  const manager = { getRepository: jest.fn(() => repo) } as unknown as EntityManager;
  const attachments = new AttachmentsRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves the attachment and reads it back by id', async () => {
    const saved = { ...file };
    repo.findOne.mockResolvedValue(saved);

    await expect(attachments.create(file, manager)).resolves.toBe(saved);
    expect(repo.create).toHaveBeenCalledWith(file);
    expect(repo.save).toHaveBeenCalledWith(file);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: file.id } });
  });

  it('returns the saved row when the follow-up read is empty', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(attachments.create(file, manager)).resolves.toEqual(file);
  });
});
