import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttachmentsEntity } from '@app/attachments/entity/attachments.entity';
import { AttachmentsRepository } from '@app/attachments/repository/attachments.repository';
import { AuthModule } from '@app/auth/auth.module';
import { UsersEntity } from '@app/users/entity/users.entity';
import { UsersModule } from '@app/users/users.module';

import { CommentsRepository } from './repository/comments.repository';
import { CommentsService } from './comments.service';
import { CommentsEntity } from './entity/comments.entity';
import { CommentsController } from './comments.controller';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TypeOrmModule.forFeature([CommentsEntity, UsersEntity, AttachmentsEntity]),
  ],

  controllers: [CommentsController],

  providers: [CommentsService, CommentsRepository, AttachmentsRepository],
})
export class CommentsModule {}
