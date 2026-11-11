import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

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
