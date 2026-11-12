import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';

import type { CommentsListQuery } from '@comments/shared';

import { CommentsEntity } from '../entity/comments.entity';

export interface CreateCommentData {
  id: string;
  rootId: string;
  parentId: string | null;
  userId: string;
  text: string;
}

@Injectable()
export class CommentsRepository {
  private readonly logger = new Logger(CommentsRepository.name);
  constructor(
    @InjectRepository(CommentsEntity)
    private readonly commentsRepository: Repository<CommentsEntity>,
  ) {}

  async findAll(query: CommentsListQuery): Promise<CommentsEntity[]> {
    const direction = query.order === 'asc' ? 'ASC' : 'DESC';
    this.logger.debug(query);

    return await this.commentsRepository.find({
      where: {
        parentId: IsNull(),
      },
      relations: { user: true },
      order:
        query.sort === 'fullName'
          ? { user: { fullName: direction }, createdAt: direction, id: direction }
          : query.sort === 'email'
            ? { user: { email: direction }, createdAt: direction, id: direction }
            : { createdAt: direction, id: direction },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
  }

  async findById(id: string): Promise<CommentsEntity | null> {
    this.logger.debug(`Finding comment by id: ${id}`);
    return await this.commentsRepository.findOne({ where: { id } });
  }

  async create(comment: CreateCommentData, manager: EntityManager): Promise<CommentsEntity> {
    this.logger.debug(comment);
    const comments = manager.getRepository(CommentsEntity);
    const saved = await comments.save(comments.create(comment));
    return (await comments.findOne({ where: { id: saved.id } })) ?? saved;
  }
}
