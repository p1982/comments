import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { TimestampedEntity } from '@app/common/entities/base.entity';

import type { CommentsEntity } from './comments.entity';

@Entity('comment_votes')
@Index(['commentId', 'voterKey'], { unique: true })
export class CommentVotesEntity extends TimestampedEntity {
  @Index()
  @Column({ name: 'comment_id', type: 'uuid' })
  commentId!: string;

  @Column({ name: 'voter_key', type: 'varchar', length: 128 })
  voterKey!: string;

  @Column({ name: 'value', type: 'smallint' })
  value!: number;

  @ManyToOne('CommentsEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment!: CommentsEntity;
}
