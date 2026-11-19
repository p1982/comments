import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OutboxEventsEntity } from './entity/outbox.entity';
import { OutboxPublisherService } from './outbox-publisher.service';
import { OutboxRepository } from './repository/outbox.repository';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEventsEntity])],
  providers: [OutboxRepository, OutboxPublisherService],
  exports: [OutboxRepository],
})
export class OutboxModule {}
