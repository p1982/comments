import { Client } from '@elastic/elasticsearch';
import { Inject, Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';

import type { CommentsResult, CommentsSearchQuery } from '@comments/shared';
import { toCommentResponse } from '@app/comments/dto/comment-response.dto';
import { toPlainText } from '@app/comments/helpers/to-plain-text';
import { CommentsRepository } from '@app/comments/repository/comments.repository';
import { ELASTICSEARCH_CLIENT } from '@app/infrastructure/elasticsearch/elasticsearch.constants';
import { COMMENTS_INDEX } from '@app/search/search.constants';
import type { CommentSearchDocument, IndexCommentInput } from '@app/search/search.types';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly commentsRepository: CommentsRepository,
    @Optional() @Inject(ELASTICSEARCH_CLIENT) private readonly elasticsearch: Client | null,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.elasticsearch) {
      return;
    }
    try {
      await this.createCommentsIndex();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Elasticsearch index bootstrap skipped: ${message}`);
    }
  }

  private async createCommentsIndex(): Promise<void> {
    if (!this.elasticsearch) {
      return;
    }

    const exists = await this.elasticsearch.indices.exists({
      index: COMMENTS_INDEX,
    });

    if (exists) {
      return;
    }

    await this.elasticsearch.indices.create({
      index: COMMENTS_INDEX,
      mappings: {
        properties: {
          id: { type: 'keyword' },
          parentId: { type: 'keyword' },
          username: {
            type: 'text',
            fields: {
              keyword: { type: 'keyword' },
            },
          },
          plainText: {
            type: 'text',
            analyzer: 'standard',
          },
          createdAt: { type: 'date' },
        },
      },
    });
  }

  async index({ id, parentId, fullName, text, createdAt }: IndexCommentInput): Promise<void> {
    const plainText = toPlainText(text);
    if (!plainText) {
      return;
    }

    const document: CommentSearchDocument = {
      id,
      parentId,
      username: fullName,
      plainText,
      createdAt,
    };

    if (!this.elasticsearch) {
      return;
    }

    await this.elasticsearch.index({
      index: COMMENTS_INDEX,
      id,
      document,
      refresh: true,
    });
  }

  async search(query: CommentsSearchQuery): Promise<CommentsResult> {
    const needle = toPlainText(query.q);
    if (!needle || !this.elasticsearch) {
      return {
        data: [],
        total: 0,
        totalPages: 0,
        status: 'success',
        message: 'Comments fetched successfully',
      };
    }

    const result = await this.elasticsearch.search<{ id: string }>({
      index: COMMENTS_INDEX,
      from: (query.page - 1) * query.limit,
      size: query.limit,
      query: {
        multi_match: { query: needle, fields: ['plainText', 'username'] },
      },
    });

    const ids = result.hits.hits
      .map((hit) => hit._source?.id ?? hit._id)
      .filter((id): id is string => Boolean(id));
    const total =
      typeof result.hits.total === 'number' ? result.hits.total : (result.hits.total?.value ?? 0);

    const comments = await this.commentsRepository.findByIds(ids);

    this.logger.debug(`search q=${query.q} hits=${String(total)}`);

    return {
      data: comments.map((comment) => toCommentResponse(comment, comment.user)),
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
      status: 'success',
      message: 'Comments fetched successfully',
    };
  }
}
