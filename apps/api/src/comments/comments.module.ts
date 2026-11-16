import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@app/auth/auth.module';
import { UsersEntity } from '@app/users/entity/users.entity';
import { UsersModule } from '@app/users/users.module';

import { CommentsRepository } from './repository/comments.repository';
import { CommentsService } from './comments.service';
import { CommentsEntity } from './entity/comments.entity';
import { CommentsController } from './comments.controller';

@Module({
  imports: [AuthModule, UsersModule, TypeOrmModule.forFeature([CommentsEntity, UsersEntity])],

  controllers: [CommentsController],

  providers: [CommentsService, CommentsRepository],
})
export class CommentsModule {}
