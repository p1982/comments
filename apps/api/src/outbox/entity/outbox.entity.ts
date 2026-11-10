import { Entity, Column, Index } from 'typeorm';

import { CreatedAtEntity } from '@app/common/entities/base.entity';

@Entity('outbox_events')
@Index(['createdAt'])
@Index(['aggregateType', 'aggregatedId'])
export class OutboxEventsEntity extends CreatedAtEntity {
  @Column({ name: 'aggregate_type', type: 'varchar', length: 255 })
  aggregateType!: string;

  @Column({ name: 'aggregated_id', type: 'uuid' })
  aggregatedId!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType!: string;

  @Column({ name: 'payload', type: 'jsonb' })
  payload!: string;

  @Column({ name: 'attempts', type: 'int' })
  attempts!: number;

  @Column({ name: 'error_message', type: 'varchar', length: 100 })
  errorMessage!: string | null;

  @Column({ name: 'processed_at', type: 'timestamp' })
  processedAt!: Date | null;
}
