import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Cache } from 'cache-manager';
import { DataSource, type EntityManager } from 'typeorm';

import { AttachmentsRepository } from '@app/attachments/repository/attachments.repository';

import { COMMENT_CREATED, COMMENTS_LIST_CACHE_VERSION_KEY } from '../comments.constants';
import { toCommentResponse } from '../dto/comment-response.dto';
import { CommentCreatedEvent } from '../events/comment-created.event';
import { CommentsGateway } from '../gateway/comments.gateway';
import { fitImage } from '../helpers/fit-image';
import { imageKind } from '../helpers/image-kind';
import { CommentsRepository } from '../repository/comments.repository';
import type { CommentJob } from './comment-job';

@Injectable()
export class CommentJobProcessor {
  private readonly logger = new Logger(CommentJobProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly commentsRepository: CommentsRepository,
    private readonly commentsGateway: CommentsGateway,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly events: EventEmitter2,
  ) {}

  async handle(job: CommentJob): Promise<void> {
    if (job.type === 'process-image') {
      const kind = imageKind(job.buffer);
      if (!kind) {
        this.logger.warn(`Invalid image buffer for comment ${job.commentId}`);
        return;
      }

      const fitted = await fitImage(job.buffer, kind);
      const imageId = crypto.randomUUID();
      const storageKey = `${imageId}.${kind}`;
      const assetsDir = join(process.cwd(), 'apps', 'api', 'assets');

      await mkdir(assetsDir, { recursive: true });
      await writeFile(join(assetsDir, storageKey), fitted);

      await this.dataSource.transaction(async (manager: EntityManager) => {
        await this.attachmentsRepository.create(
          {
            id: imageId,
            commentId: job.commentId,
            fileName: job.fileName,
            file_type: 'image',
            mimeType: `image/${kind}`,
            fileSize: fitted.length,
            storageKey,
          },
          manager,
        );
      });

      const version = (await this.cache.get<number>(COMMENTS_LIST_CACHE_VERSION_KEY)) ?? 0;
      await this.cache.set(COMMENTS_LIST_CACHE_VERSION_KEY, version + 1);

      const updated = await this.commentsRepository.findById(job.commentId);
      if (updated) {
        this.commentsGateway.broadcastCommentCreated(toCommentResponse(updated, updated.user));
      }

      this.logger.debug(`Processed image for comment ${job.commentId}`);
      return;
    }

    this.events.emit(COMMENT_CREATED, new CommentCreatedEvent(job.comment));
  }
}
