import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';

import { OutboxEventsEntity } from '../entity/outbox.entity';

export interface CreateOutboxEventData {
  aggregateType: string;
  aggregatedId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class OutboxRepository {
  private readonly logger = new Logger(OutboxRepository.name);
  constructor(
    @InjectRepository(OutboxEventsEntity)
    private readonly outboxEventsRepository: Repository<OutboxEventsEntity>,
  ) {}

  async findPending(limit: number): Promise<OutboxEventsEntity[]> {
    return await this.outboxEventsRepository.find({
      where: { processedAt: IsNull() },
      order: { createdAt: 'ASC', id: 'ASC' },
      take: limit,
    });
  }

  async markProcessed(id: string): Promise<void> {
    await this.outboxEventsRepository.update(
      { id },
      { processedAt: new Date(), errorMessage: null },
    );
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.outboxEventsRepository
      .createQueryBuilder()
      .update(OutboxEventsEntity)
      .set({
        attempts: () => '"attempts" + 1',
        errorMessage: error.slice(0, 100),
      })
      .where('id = :id', { id })
      .execute();
  }

  async insert(data: CreateOutboxEventData, manager: EntityManager): Promise<OutboxEventsEntity> {
    this.logger.debug(
      `insert ${data.eventType} aggregate=${data.aggregateType}/${data.aggregatedId}`,
    );
    const outbox = manager.getRepository(OutboxEventsEntity);
    const saved = await outbox.save(
      outbox.create({
        aggregateType: data.aggregateType,
        aggregatedId: data.aggregatedId,
        eventType: data.eventType,
        payload: data.payload as unknown as string,
        attempts: 0,
        errorMessage: null,
        processedAt: null,
      }),
    );
    return (await outbox.findOne({ where: { id: saved.id } })) ?? saved;
  }
}
