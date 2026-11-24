import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersEntity } from '@app/users/entity/users.entity';
import { AttachmentsEntity } from '@app/attachments/entity/attachments.entity';
import { CommentsEntity } from '@app/comments/entity/comments.entity';
import { CommentVotesEntity } from '@app/comments/entity/comment-votes.entity';
import { CommentsRepository } from '@app/comments/repository/comments.repository';
import { CommentVotesRepository } from '@app/comments/repository/comment-votes.repository';
import { ElasticsearchModule } from '@app/infrastructure/elasticsearch/elasticsearch.module';

import { SearchService } from './search.service';

@Module({
  imports: [
    ElasticsearchModule,
    TypeOrmModule.forFeature([CommentsEntity, CommentVotesEntity, UsersEntity, AttachmentsEntity]),
  ],
  providers: [SearchService, CommentsRepository, CommentVotesRepository],
  exports: [SearchService],
})
export class SearchModule {}
