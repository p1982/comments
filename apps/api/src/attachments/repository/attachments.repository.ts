import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { AttachmentsEntity } from '../entity/attachments.entity';

export interface CreateAttachmentData {
  id: string;
  commentId: string;
  fileName: string;
  file_type: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
}

@Injectable()
export class AttachmentsRepository {
  private readonly logger = new Logger(AttachmentsRepository.name);

  async create(file: CreateAttachmentData, manager: EntityManager): Promise<AttachmentsEntity> {
    this.logger.debug(file);
    const attachments = manager.getRepository(AttachmentsEntity);
    const saved = await attachments.save(attachments.create(file));
    return (await attachments.findOne({ where: { id: saved.id } })) ?? saved;
  }
}
