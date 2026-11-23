import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

import { SoftDeleteTableEntity } from '@app/common/entities/base.entity';
import { UsersEntity } from '@app/users/entity/users.entity';
import { AttachmentsEntity } from '@app/attachments/entity/attachments.entity';

@Entity('comments')
@Index(['rootId', 'createdAt'])
export class CommentsEntity extends SoftDeleteTableEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Index()
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @Column({ name: 'root_id', type: 'uuid' })
  rootId!: string;

  @Column({ name: 'text', type: 'text' })
  text!: string;

  @ManyToOne('UsersEntity', 'comments')
  @JoinColumn({ name: 'user_id' })
  user!: UsersEntity;

  @OneToMany('AttachmentsEntity', 'comments')
  attachments!: AttachmentsEntity[];
}
