import { resolve } from 'node:path';

import { Module, type DynamicModule, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config as loadEnv } from 'dotenv';
import { CacheModule } from '@nestjs/cache-manager';

import { AttachmentsEntity } from '@app/attachments/entity/attachments.entity';
import { AttachmentsRepository } from '@app/attachments/repository/attachments.repository';
import { AuthModule } from '@app/auth/auth.module';
import { SearchModule } from '@app/search/search.module';
import { UsersEntity } from '@app/users/entity/users.entity';
import { UsersModule } from '@app/users/users.module';

import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsEntity } from './entity/comments.entity';
import { CommentResolver } from './graphql/comments.resolver';
import { UploadScalar } from './graphql/upload.scalar';
import { CommentsGateway } from './gateway/comments.gateway';
import { CommentCreatedListener } from './listeners/comment-created.listener';
import { COMMENT_JOB_CLIENT, COMMENT_QUEUE, COMMENT_QUEUE_NAME } from './comments.constants';
import { type CommentQueuePort, resolveCommentQueueMode } from './queue/comment-job';
import { CommentJobConsumer } from './queue/comment-job.consumer';
import { CommentJobProcessor } from './queue/comment-job.processor';
import { CommentQueueService } from './queue/comment-queue.service';
import { CommentsRepository } from './repository/comments.repository';
import { RabbitCommentQueueService } from './queue/rabbit-comment-queue.service';

loadEnv({ path: resolve(process.cwd(), '.env') });
loadEnv({ path: resolve(process.cwd(), '../../.env') });

const queueMode = resolveCommentQueueMode(process.env['COMMENT_QUEUE_MODE']);
const useRabbit = queueMode === 'rabbit';

const syncQueue: CommentQueuePort = {
  enqueue() {
    // sync mode handles fit + emit inside CommentsService
  },
};

const commentQueueProvider: Provider = {
  provide: COMMENT_QUEUE,
  inject: useRabbit
    ? [ConfigService, CommentQueueService, RabbitCommentQueueService]
    : [ConfigService, CommentQueueService],
  useFactory: (
    configService: ConfigService,
    memoryQueue: CommentQueueService,
    rabbitQueue?: RabbitCommentQueueService,
  ): CommentQueuePort => {
    const mode = resolveCommentQueueMode(configService.get<string>('COMMENT_QUEUE_MODE'));
    if (mode === 'memory') {
      return memoryQueue;
    }
    if (mode === 'rabbit') {
      if (!rabbitQueue) {
        throw new Error(
          'COMMENT_QUEUE_MODE=rabbit but RabbitCommentQueueService is not registered',
        );
      }
      return rabbitQueue;
    }
    return syncQueue;
  },
};

const rabbitImports: DynamicModule[] = useRabbit
  ? [
      ClientsModule.registerAsync([
        {
          name: COMMENT_JOB_CLIENT,
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            transport: Transport.RMQ,
            options: {
              urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
              queue: configService.get<string>('COMMENT_QUEUE_NAME', COMMENT_QUEUE_NAME),
              queueOptions: { durable: true },
            },
          }),
        },
      ]),
    ]
  : [];

@Module({
  imports: [
    AuthModule,
    UsersModule,
    SearchModule,
    TypeOrmModule.forFeature([CommentsEntity, UsersEntity, AttachmentsEntity]),
    ...rabbitImports,
    CacheModule.register({
      ttl: 30_000,
      max: 100,
    }),
  ],

  controllers: [CommentsController, ...(useRabbit ? [CommentJobConsumer] : [])],

  providers: [
    CommentsService,
    CommentsRepository,
    AttachmentsRepository,
    CommentCreatedListener,
    CommentsGateway,
    CommentJobProcessor,
    CommentQueueService,
    ...(useRabbit ? [RabbitCommentQueueService] : []),
    commentQueueProvider,
    CommentResolver,
    UploadScalar,
  ],
})
export class CommentsModule {}
