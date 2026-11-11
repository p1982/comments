import { Entity, Column, Index, OneToMany } from 'typeorm';

import { SoftDeleteTableEntity } from '@app/common/entities/base.entity';
import { CommentsEntity } from '@app/comments/entity/comments.entity';

@Entity('users')
export class UsersEntity extends SoftDeleteTableEntity {
  @Index()
  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName!: string;

  @Index()
  @Column({ name: 'email', type: 'varchar', length: 255 })
  email!: string;

  @Column({ name: 'homepage', type: 'varchar', length: 500 })
  homepage!: string | null;

  @OneToMany('CommentsEntity', 'user')
  comments!: CommentsEntity[];
}
