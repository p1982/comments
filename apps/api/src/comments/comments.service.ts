import type {
  CommentResponse,
  CommentsListQuery,
  CommentsResult,
  CommentsSchema,
} from '@comments/shared';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UsersRepository } from '@app/users/repository/users.repository';
import { ERROR_MESSAGES } from '@app/common/filter/error-messages';
import { UsersEntity } from '@app/users/entity/users.entity';
import { toCommentResponse } from './dto/comment-response.dto';
import { CommentsRepository } from './repository/comments.repository';
import { CommentsEntity } from './entity/comments.entity';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersRepository: UsersRepository,
    private readonly commentsRepository: CommentsRepository,
  ) {}

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
      const [comments, total] = await this.commentsRepository.findAll(query);
      return {
        data: comments.map((comment) => toCommentResponse(comment, comment.user)),
        total,
        totalPages: Math.ceil(total / query.limit),
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

  async createComment(comment: CommentsSchema, user: UsersEntity | null): Promise<CommentResponse> {
    this.logger.log(`Creating comment for ${comment.fullName}`);
    try {
      return await this.dataSource.transaction(async (manager) => {
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
        return toCommentResponse(savedComment, savedUser);
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(error);
      throw new InternalServerErrorException(ERROR_MESSAGES.internalServerError);
    }
  }
}
