import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, type EntityManager } from 'typeorm';

import type { CommentVoteValue, UserVoteValue } from '@comments/shared';

import { CommentVotesEntity } from '../entity/comment-votes.entity';

export interface ToggleVoteResult {
  delta: number;
  userVote: UserVoteValue;
}

@Injectable()
export class CommentVotesRepository {
  constructor(
    @InjectRepository(CommentVotesEntity)
    private readonly commentVotesRepository: Repository<CommentVotesEntity>,
  ) {}

  async findUserVotesByCommentIds(
    commentIds: string[],
    voterKey: string | null,
  ): Promise<Map<string, UserVoteValue>> {
    if (commentIds.length === 0 || !voterKey) {
      return new Map();
    }

    const rows = await this.commentVotesRepository.find({
      where: {
        commentId: In(commentIds),
        voterKey,
      },
      select: {
        commentId: true,
        value: true,
      },
    });

    return new Map(
      rows.map((row) => [row.commentId, row.value === 1 ? 1 : row.value === -1 ? -1 : 0]),
    );
  }

  async toggleVote(
    commentId: string,
    voterKey: string,
    value: CommentVoteValue,
    manager: EntityManager,
  ): Promise<ToggleVoteResult> {
    const repo = manager.getRepository(CommentVotesEntity);
    const existing = await repo.findOne({
      where: { commentId, voterKey },
    });

    if (!existing) {
      await repo.save(repo.create({ commentId, voterKey, value }));
      return { delta: value, userVote: value };
    }

    if (existing.value === value) {
      await repo.delete({ id: existing.id });
      return { delta: -value, userVote: 0 };
    }

    const delta = value - existing.value;
    existing.value = value;
    await repo.save(existing);
    return { delta, userVote: value };
  }
}
