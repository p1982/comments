import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

import { CommentsEntity } from '@app/comments/entity/comments.entity';
import { SoftDeleteTableEntity } from '@app/common/entities/base.entity';

@Entity('attachments')
export class AttachmentsEntity extends SoftDeleteTableEntity {
  @Index()
  @Column({ name: 'comment_id', type: 'uuid' })
  commentId!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ name: 'file_type', type: 'varchar', length: 50 })
  file_type!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 50 })
  mimeType!: number;

  @Column({ name: 'file_size', type: 'int' })
  fileSize!: string;

  @Column({ name: 'storage_key', type: 'varchar', length: 255 })
  storageKey!: string;

  @ManyToOne('CommentsEntity', 'attachments')
  @JoinColumn({ name: 'comment_id' })
  comments!: CommentsEntity;
}
