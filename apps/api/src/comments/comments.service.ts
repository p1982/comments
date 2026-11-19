import { timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, type EntityManager } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import type {
  CommentResponse,
  CommentsListQuery,
  CommentsResult,
  CommentsSchema,
} from '@comments/shared';
import { AttachmentsRepository } from '@app/attachments/repository/attachments.repository';
import { ERROR_MESSAGES } from '@app/common/filter/error-messages';
import { signCaptcha } from '@app/captcha/captcha.service';
import { UsersEntity } from '@app/users/entity/users.entity';
import { UsersRepository } from '@app/users/repository/users.repository';
import { OutboxRepository } from '@app/outbox/repository/outbox.repository';

import { toCommentResponse } from './dto/comment-response.dto';
import { CommentsRepository } from './repository/comments.repository';
import { CommentsEntity } from './entity/comments.entity';
import { fitImage } from './helpers/fit-image';
import { imageKind } from './helpers/image-kind';
import { COMMENT_QUEUE, COMMENTS_LIST_CACHE_VERSION_KEY } from './comments.constants';
import { commentsListCacheKey } from './helpers/comments-list-cache-key';
import { type CommentQueuePort, resolveCommentQueueMode } from './queue/comment-job';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersRepository: UsersRepository,
    private readonly commentsRepository: CommentsRepository,
    private readonly configService: ConfigService,
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly outboxRepository: OutboxRepository,
    @Inject(COMMENT_QUEUE) private readonly commentQueue: CommentQueuePort,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private getQueueMode() {
    return resolveCommentQueueMode(this.configService.get<string>('COMMENT_QUEUE_MODE'));
  }

  async getCommentsByRootId(rootId: string): Promise<CommentsResult> {
    this.logger.log(`Getting children comments for root id: ${rootId}`);
    try {
      const comments = await this.commentsRepository.findById(rootId);
      if (!comments) {
        throw new NotFoundException(ERROR_MESSAGES.notFound);
      }

      const childrenComments = await this.commentsRepository.findByRootId(rootId);
      return {
        data: childrenComments.map((comment: CommentsEntity) =>
          toCommentResponse(comment, comment.user),
        ),
        status: 'success',
        message: 'Comments fetched successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(error);
      throw new InternalServerErrorException(ERROR_MESSAGES.internalServerError);
    }
  }

  async getComments(query: CommentsListQuery): Promise<CommentsResult> {
    this.logger.log(`Getting all comments with query: ${JSON.stringify(query)}`);
    try {
      const version = (await this.cache.get<number>(COMMENTS_LIST_CACHE_VERSION_KEY)) ?? 0;
      const key = commentsListCacheKey(query, version);
      const cached = await this.cache.get<CommentsResult>(key);
      if (cached) {
        return cached;
      }
      const [comments, total] = await this.commentsRepository.findAll(query);
      const result: CommentsResult = {
        data: comments.map((c) => toCommentResponse(c, c.user)),
        total,
        totalPages: Math.ceil(total / query.limit),
        status: 'success',
        message: 'Comments fetched successfully',
      };

      await this.cache.set(key, result);
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(error);
      throw new InternalServerErrorException(ERROR_MESSAGES.internalServerError);
    }
  }

  async createComment(
    comment: CommentsSchema,
    captchaToken: string | null,
    user: UsersEntity | null,
    image?: Express.Multer.File,
    textFile?: Express.Multer.File,
  ): Promise<CommentResponse> {
    this.logger.log(
      image
        ? `Creating comment for ${comment.fullName} with ${image.originalname}`
        : `Creating comment for ${comment.fullName}`,
    );
    try {
      const secret = this.configService.getOrThrow<string>('CAPTCHA_SECRET');
      const expected = signCaptcha(comment.captcha, secret);
      const actual = Buffer.from(captchaToken ?? '');
      const wanted = Buffer.from(expected);
      const matches = actual.length === wanted.length && timingSafeEqual(actual, wanted);
      if (!matches) {
        throw new BadRequestException(ERROR_MESSAGES.invalidCaptcha);
      }

      const queueMode = this.getQueueMode();
      const useQueue = queueMode !== 'sync';
      let pendingImage: { buffer: Buffer; fileName: string } | undefined;

      const response = await this.dataSource.transaction(async (manager) => {
        const findUser = await this.usersRepository.findByEmail(comment.email);
        const savedUser =
          user ??
          findUser ??
          (await this.usersRepository.create(
            {
              email: comment.email,
              fullName: comment.fullName,
              homepage: comment.homepage ?? '',
            },
            manager,
          ));
        const id = crypto.randomUUID();
        let parentId: string | null;
        let rootId: string;
        if (!comment.parentId) {
          parentId = null;
          rootId = id;
        } else {
          const parent: CommentsEntity | null = await this.commentsRepository.findById(
            comment.parentId,
          );
          if (!parent) {
            throw new NotFoundException(ERROR_MESSAGES.notFound);
          }
          parentId = parent.id;
          rootId = parent.rootId;
        }

        const savedComment = await this.commentsRepository.create(
          {
            id,
            rootId,
            parentId,
            userId: savedUser.id,
            text: comment.text,
          },
          manager,
        );
        const assetsDir = join(process.cwd(), 'apps', 'api', 'assets');

        if (image) {
          const kind = imageKind(image.buffer);
          if (!kind) {
            throw new BadRequestException(ERROR_MESSAGES.invalidImage);
          }

          if (useQueue) {
            pendingImage = { buffer: image.buffer, fileName: image.originalname };
          } else {
            await this.saveFittedImage(image, id, kind, assetsDir, manager);
          }
        }

        if (textFile) {
          const MAX_TEXT_FILE = 100 * 1024;
          if (textFile.buffer.length > MAX_TEXT_FILE || textFile.buffer.includes(0)) {
            throw new BadRequestException(ERROR_MESSAGES.textFileTooLarge);
          }
          const textId = crypto.randomUUID();
          const storageKey = `${textId}.txt`;
          await mkdir(assetsDir, { recursive: true });
          await writeFile(join(assetsDir, storageKey), textFile.buffer);
          await this.attachmentsRepository.create(
            {
              id: textId,
              commentId: id,
              fileName: textFile.originalname,
              file_type: 'text',
              mimeType: 'text/plain',
              fileSize: textFile.buffer.length,
              storageKey,
            },
            manager,
          );
        }

        const commentWithAttachments =
          (await manager.getRepository(CommentsEntity).findOne({
            where: { id },
            relations: { attachments: true },
          })) ?? savedComment;

        const commentResponse = toCommentResponse(commentWithAttachments, savedUser);

        await this.outboxRepository.insert(
          {
            aggregateType: 'comment',
            aggregatedId: id,
            eventType: 'comment.created',
            payload: { comment: commentResponse },
          },
          manager,
        );
        this.logger.debug(`Outbox enqueued comment.created for ${id}`);
        return commentResponse;
      });

      if (pendingImage) {
        await this.commentQueue.enqueue({
          type: 'process-image',
          commentId: response.id,
          fileName: pendingImage.fileName,
          buffer: pendingImage.buffer,
        });
        this.logger.debug(`Queued process-image for ${response.id}`);
      }

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(error);
      throw new InternalServerErrorException(ERROR_MESSAGES.internalServerError);
    }
  }

  private async saveFittedImage(
    image: Express.Multer.File,
    commentId: string,
    kind: NonNullable<ReturnType<typeof imageKind>>,
    assetsDir: string,
    manager: EntityManager,
  ): Promise<void> {
    const imageBuffer = await fitImage(image.buffer, kind);
    const imageId = crypto.randomUUID();
    const storageKey = `${imageId}.${kind}`;

    await mkdir(assetsDir, { recursive: true });
    await writeFile(join(assetsDir, storageKey), imageBuffer);
    await this.attachmentsRepository.create(
      {
        id: imageId,
        commentId,
        fileName: image.originalname,
        file_type: 'image',
        mimeType: `image/${kind}`,
        fileSize: imageBuffer.length,
        storageKey,
      },
      manager,
    );
  }
}
