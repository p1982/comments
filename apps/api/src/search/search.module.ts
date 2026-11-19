import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersEntity } from '@app/users/entity/users.entity';
import { AttachmentsEntity } from '@app/attachments/entity/attachments.entity';
import { CommentsEntity } from '@app/comments/entity/comments.entity';
import { CommentsRepository } from '@app/comments/repository/comments.repository';
import { ElasticsearchModule } from '@app/infrastructure/elasticsearch/elasticsearch.module';

import { SearchService } from './search.service';

@Module({
  imports: [
    ElasticsearchModule,
    TypeOrmModule.forFeature([CommentsEntity, UsersEntity, AttachmentsEntity]),
  ],
  providers: [SearchService, CommentsRepository],
  exports: [SearchService],
})
export class SearchModule {}
