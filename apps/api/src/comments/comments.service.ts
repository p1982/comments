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
  CommentVoteResult,
  CommentVoteValue,
} from '@comments/shared';
import { AttachmentsRepository } from '@app/attachments/repository/attachments.repository';
import { ERROR_MESSAGES } from '@app/common/filter/error-messages';
import { signCaptcha } from '@app/captcha/captcha.service';
import { UsersEntity } from '@app/users/entity/users.entity';
import { UsersRepository } from '@app/users/repository/users.repository';
import { OutboxRepository } from '@app/outbox/repository/outbox.repository';

import { toCommentResponse } from './dto/comment-response.dto';
import { CommentsRepository } from './repository/comments.repository';
import { CommentVotesRepository } from './repository/comment-votes.repository';
import { CommentsEntity } from './entity/comments.entity';
import { CommentsGateway } from './gateway/comments.gateway';
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
    private readonly commentVotesRepository: CommentVotesRepository,
    private readonly commentsGateway: CommentsGateway,
  ) {}

  private getQueueMode() {
    return resolveCommentQueueMode(this.configService.get<string>('COMMENT_QUEUE_MODE'));
  }

  private async attachUserVotes(
    result: CommentsResult,
    voterKey: string | null,
  ): Promise<CommentsResult> {
    if (!voterKey || result.data.length === 0) {
      return result;
    }

    const votes = await this.commentVotesRepository.findUserVotesByCommentIds(
      result.data.map((item) => item.id),
      voterKey,
    );

    return {
      ...result,
      data: result.data.map((item) => ({
        ...item,
        userVote: votes.get(item.id) ?? 0,
      })),
    };
  }

  /**
   * Loads all nested replies belonging to a root comment thread and attaches the caller's vote state.
   *
   * @param rootId UUID of the top-level comment.
   * @param voterKey Optional voter identifier (`user:<id>` or `guest:<uuid>`) to populate `userVote`.
   * @returns Reply list response for the thread.
   * @throws NotFoundException When the root comment does not exist.
   */
  async getCommentsByRootId(
    rootId: string,
    voterKey: string | null = null,
  ): Promise<CommentsResult> {
    this.logger.log(`Getting children comments for root id: ${rootId}`);
    try {
      const comments = await this.commentsRepository.findById(rootId);
      if (!comments) {
        throw new NotFoundException(ERROR_MESSAGES.notFound);
      }

      const childrenComments = await this.commentsRepository.findByRootId(rootId);
      const userVotes = await this.commentVotesRepository.findUserVotesByCommentIds(
        childrenComments.map((comment) => comment.id),
        voterKey,
      );
      return {
        data: childrenComments.map((comment: CommentsEntity) =>
          toCommentResponse(comment, comment.user, 0, userVotes.get(comment.id) ?? 0),
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

  /**
   * Returns a paginated, sorted page of root comments using the versioned in-process list cache,
   * overlaying per-voter `userVote` values outside the shared cache.
   *
   * @param query Pagination and sort options (`page`, `limit`, `sort`, `order`).
   * @param voterKey Optional voter identifier to overlay `userVote`.
   * @returns Paginated root comments with total counts and reply counts.
   */
  async getComments(
    query: CommentsListQuery,
    voterKey: string | null = null,
  ): Promise<CommentsResult> {
    this.logger.log(`Getting all comments with query: ${JSON.stringify(query)}`);
    try {
      const version = (await this.cache.get<number>(COMMENTS_LIST_CACHE_VERSION_KEY)) ?? 0;
      const key = commentsListCacheKey(query, version);
      const cached = await this.cache.get<CommentsResult>(key);
      if (cached) {
        return await this.attachUserVotes(cached, voterKey);
      }
      const [comments, total] = await this.commentsRepository.findAll(query);
      const replyCounts = await this.commentsRepository.countRepliesByRootIds(
        comments.map((c) => c.id),
      );
      const result: CommentsResult = {
        data: comments.map((c) => toCommentResponse(c, c.user, replyCounts.get(c.id) ?? 0)),
        total,
        totalPages: Math.ceil(total / query.limit),
        status: 'success',
        message: 'Comments fetched successfully',
      };

      await this.cache.set(key, result);
      return await this.attachUserVotes(result, voterKey);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(error);
      throw new InternalServerErrorException(ERROR_MESSAGES.internalServerError);
    }
  }

  /**
   * Atomically toggles an upvote (`+1`) or downvote (`-1`) on a comment, updates `comments.votes_score`,
   * invalidates the list cache, and broadcasts `comment.voted` over WebSocket.
   *
   * @param commentId Target comment UUID.
   * @param value Vote direction (`1` for upvote, `-1` for downvote).
   * @param voterKey Stable voter identifier (`user:<id>` or `guest:<uuid>`).
   * @returns Updated aggregate score and the voter's resulting vote (`-1`, `0`, or `1`).
   * @throws NotFoundException When the comment does not exist.
   */
  async voteComment(
    commentId: string,
    value: CommentVoteValue,
    voterKey: string,
  ): Promise<CommentVoteResult> {
    this.logger.log(`Voting comment ${commentId} value=${String(value)}`);
    try {
      const existing = await this.commentsRepository.findById(commentId);
      if (!existing) {
        throw new NotFoundException(ERROR_MESSAGES.notFound);
      }

      const { votesScore, userVote } = await this.dataSource.transaction(async (manager) => {
        const { delta, userVote: nextVote } = await this.commentVotesRepository.toggleVote(
          commentId,
          voterKey,
          value,
          manager,
        );
        const nextScore = await this.commentsRepository.adjustVotesScore(commentId, delta, manager);
        return { votesScore: nextScore, userVote: nextVote };
      });

      await this.bumpCommentsListCache();
      this.commentsGateway.broadcastCommentVoted({
        commentId,
        rootId: existing.rootId,
        votesScore,
      });

      return { commentId, votesScore, userVote };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(error);
      throw new InternalServerErrorException(ERROR_MESSAGES.internalServerError);
    }
  }

  /**
   * Validates the HMAC captcha cookie, persists the comment, optional attachments, and an outbox
   * `comment.created` event in a single DB transaction, then enqueues async image resizing (when not
   * in `sync` mode) and invalidates the list cache.
   *
   * @param comment Validated comment payload.
   * @param captchaToken HMAC token from the `captcha` httpOnly cookie.
   * @param user Signed-in user entity, or `null` for anonymous posting.
   * @param image Optional uploaded image (JPG/PNG/GIF, fitted to <= 320x240).
   * @param textFile Optional uploaded `.txt` file (<= 100 KB, no null bytes).
   * @returns Hydrated comment DTO.
   * @throws BadRequestException When captcha, image, or text file validation fails.
   * @throws NotFoundException When `parentId` references a non-existent comment.
   */
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

      // Invalidate list cache in-request so GET is not stale while outbox handles WS/ES.
      await this.bumpCommentsListCache();

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(error);
      throw new InternalServerErrorException(ERROR_MESSAGES.internalServerError);
    }
  }

  private async bumpCommentsListCache(): Promise<void> {
    const version = (await this.cache.get<number>(COMMENTS_LIST_CACHE_VERSION_KEY)) ?? 0;
    const next = version + 1;
    await this.cache.set(COMMENTS_LIST_CACHE_VERSION_KEY, next);
    this.logger.debug(`comments list cache bumped to v${String(next)}`);
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
