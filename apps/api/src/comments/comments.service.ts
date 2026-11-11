import type { CommentResponse, CommentsSchema } from '@comments/shared';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UsersRepository } from '@app/users/repository/users.repository';
import { ERROR_MESSAGES } from '@app/common/filter/error-messages';
import { UsersEntity } from '@app/users/entity/users.entity';
import { toCommentResponse } from './dto/comment-response.dto';
import { CommentsRepository } from './repository/comments.repository';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersRepository: UsersRepository,
    private readonly commentsRepository: CommentsRepository,
  ) {}

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
        const savedComment = await this.commentsRepository.create(
          {
            id,
            rootId: id,
            parentId: null,
            userId: savedUser.id,
            text: comment.text,
          },
          manager,
        );
        return toCommentResponse(savedComment, savedUser);
      });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(ERROR_MESSAGES.internalServerError);
    }
  }
}
