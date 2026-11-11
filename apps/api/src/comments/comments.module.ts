import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsRepository } from './repository/comments.repository';
import { CommentsService } from './comments.service';
import { CommentsEntity } from './entity/comments.entity';
import { CommentsController } from './comments.controller';
import { UsersEntity } from '@app/users/entity/users.entity';
import { UsersModule } from '@app/users/users.module';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([CommentsEntity, UsersEntity])],

  controllers: [CommentsController],

  providers: [CommentsService, CommentsRepository],
})
export class CommentsModule {}
