import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

import { SoftDeleteTableEntity } from '@app/common/entities/base.entity';
import { UserEntity } from '@app/users/entity/user.entity';
import { AttachmentsEntity } from '@app/attachments/entity/attachments.entity';

@Entity('comments')
@Index(['rootId', 'createdAt'])
export class CommentsEntity extends SoftDeleteTableEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Index()
  @Column({ name: 'parent_id', type: 'uuid' })
  parentId!: string | null;

  @Column({ name: 'root_id', type: 'uuid' })
  rootId!: string;

  @Column({ name: 'text', type: 'text' })
  text!: string;

  @ManyToOne('UserEntity', 'comments')
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @OneToMany('AttachmentsEntity', 'comments')
  attachments!: AttachmentsEntity[];
}
