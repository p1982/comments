import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, IsNull, Repository, Not } from 'typeorm';

import type { CommentsListQuery } from '@comments/shared';

import { CommentsEntity } from '../entity/comments.entity';

export interface CreateCommentData {
  id: string;
  rootId: string;
  parentId: string | null;
  userId: string;
  text: string;
}

const escapeLike = (value: string): string => value.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class CommentsRepository {
  private readonly logger = new Logger(CommentsRepository.name);
  constructor(
    @InjectRepository(CommentsEntity)
    private readonly commentsRepository: Repository<CommentsEntity>,
  ) {}

  async findByRootId(rootId: string): Promise<CommentsEntity[]> {
    this.logger.debug(`Finding comments by root id: ${rootId}`);
    return await this.commentsRepository.find({
      where: { rootId, parentId: Not(IsNull()) },
      relations: { user: true, attachments: true },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  }

  async findAll(query: CommentsListQuery): Promise<[CommentsEntity[], number]> {
    const direction = query.order === 'asc' ? 'ASC' : 'DESC';
    this.logger.debug(query);

    return await this.commentsRepository.findAndCount({
      where: {
        parentId: IsNull(),
      },
      relations: { user: true, attachments: true },
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
    return await this.commentsRepository.findOne({
      where: { id },
      relations: { user: true, attachments: true },
    });
  }

  async findByIds(ids: string[]): Promise<CommentsEntity[]> {
    if (ids.length === 0) {
      return [];
    }
    this.logger.debug(`Finding comments by ids: ${ids.join(',')}`);
    const comments = await this.commentsRepository.find({
      where: { id: In(ids) },
      relations: { user: true, attachments: true },
    });
    const byId = new Map(comments.map((comment) => [comment.id, comment]));
    return ids.flatMap((id) => {
      const comment = byId.get(id);
      return comment ? [comment] : [];
    });
  }

  async searchByText(
    needle: string,
    page: number,
    limit: number,
  ): Promise<[CommentsEntity[], number]> {
    const pattern = `%${escapeLike(needle)}%`;
    this.logger.debug(
      `Fallback DB search pattern=${pattern} page=${String(page)} limit=${String(limit)}`,
    );

    return await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.attachments', 'attachments')
      .where(
        "regexp_replace(comment.text, '<[^>]+>', ' ', 'g') ILIKE :pattern ESCAPE '\\' OR user.fullName ILIKE :pattern ESCAPE '\\'",
        { pattern },
      )
      .orderBy('comment.createdAt', 'DESC')
      .addOrderBy('comment.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  async findBatchForIndex(offset: number, limit: number): Promise<CommentsEntity[]> {
    return await this.commentsRepository.find({
      relations: { user: true },
      order: { createdAt: 'ASC', id: 'ASC' },
      skip: offset,
      take: limit,
    });
  }

  async countRepliesByRootIds(rootIds: string[]): Promise<Map<string, number>> {
    if (rootIds.length === 0) {
      return new Map();
    }

    const rows = await this.commentsRepository
      .createQueryBuilder('comment')
      .select('comment.rootId', 'rootId')
      .addSelect('COUNT(comment.id)', 'count')
      .where('comment.rootId IN (:...rootIds)', { rootIds })
      .andWhere('comment.parentId IS NOT NULL')
      .groupBy('comment.rootId')
      .getRawMany<{ rootId: string; count: string }>();

    return new Map(rows.map((row) => [row.rootId, Number(row.count)]));
  }

  async create(comment: CreateCommentData, manager: EntityManager): Promise<CommentsEntity> {
    this.logger.debug(comment);
    const comments = manager.getRepository(CommentsEntity);
    const saved = await comments.save(comments.create(comment));
    return (
      (await comments.findOne({
        where: { id: saved.id },
        relations: { attachments: true },
      })) ?? saved
    );
  }
}
