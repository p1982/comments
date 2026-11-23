import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class UuidEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
}

export abstract class CreatedAtEntity extends UuidEntity {
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}

export abstract class TimestampedEntity extends UuidEntity {
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}

export abstract class SoftDeleteTableEntity extends TimestampedEntity {
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
  deletedAt!: Date | null;
}
