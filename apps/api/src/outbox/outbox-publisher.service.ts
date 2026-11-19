import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import type { CommentResponse } from '@comments/shared';
import { COMMENT_CREATED } from '@app/comments/comments.constants';
import { CommentCreatedEvent } from '@app/comments/events/comment-created.event';

import { OutboxRepository } from './repository/outbox.repository';

@Injectable()
export class OutboxPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly events: EventEmitter2,
  ) {}

  onModuleInit(): void {
    this.logger.log('Outbox publisher started (interval 1s)');
    this.timer = setInterval(() => {
      void this.tick();
    }, 1000);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.logger.log('Outbox publisher stopped');
  }

  private async tick(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      const pending = await this.outboxRepository.findPending(20);
      if (pending.length === 0) {
        return;
      }
      this.logger.debug(`Processing ${String(pending.length)} outbox event(s)`);
      for (const event of pending) {
        try {
          if (event.eventType === 'comment.created') {
            const payload = event.payload as unknown as { comment: CommentResponse };
            this.events.emit(COMMENT_CREATED, new CommentCreatedEvent(payload.comment));
            this.logger.debug(
              `Emitted ${event.eventType} for ${event.aggregatedId} (outbox ${event.id})`,
            );
          } else {
            this.logger.warn(`Skipping unknown outbox eventType=${event.eventType} id=${event.id}`);
          }
          await this.outboxRepository.markProcessed(event.id);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Failed outbox event ${event.id}: ${message}`);
          await this.outboxRepository.markFailed(event.id, message);
        }
      }
    } finally {
      this.running = false;
    }
  }
}
