import { Client, type estypes } from '@elastic/elasticsearch';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';

import type { CommentsResult, CommentsSearchQuery } from '@comments/shared';
import { toCommentResponse } from '@app/comments/dto/comment-response.dto';
import { toPlainText } from '@app/comments/helpers/to-plain-text';
import { CommentsRepository } from '@app/comments/repository/comments.repository';
import { ERROR_MESSAGES } from '@app/common/filter/error-messages';
import { ELASTICSEARCH_CLIENT } from '@app/infrastructure/elasticsearch/elasticsearch.constants';
import {
  COMMENTS_INDEX,
  COMMENTS_INDEX_MAPPINGS,
  COMMENTS_INDEX_SETTINGS,
  COMMENTS_REINDEX_BATCH_SIZE,
} from '@app/search/search.constants';
import type { CommentSearchDocument, IndexCommentInput } from '@app/search/search.types';

const escapeEsWildcard = (value: string): string => value.replace(/[\\*?]/g, '\\$&');

const formatError = (error: unknown): string =>
  error instanceof Error ? error.message || error.name : 'unknown error';

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
      const created = await this.createCommentsIndex();
      if (created) {
        await this.reindexAll();
        return;
      }

      const { count } = await this.elasticsearch.count({ index: COMMENTS_INDEX });
      if (count === 0) {
        await this.reindexAll();
      }
    } catch (error) {
      this.logger.warn(`Elasticsearch index bootstrap skipped: ${formatError(error)}`);
    }
  }

  private async createCommentsIndex(): Promise<boolean> {
    if (!this.elasticsearch) {
      return false;
    }

    const exists = await this.elasticsearch.indices.exists({
      index: COMMENTS_INDEX,
    });

    if (exists) {
      return false;
    }

    await this.elasticsearch.indices.create({
      index: COMMENTS_INDEX,
      settings: COMMENTS_INDEX_SETTINGS,
      mappings: COMMENTS_INDEX_MAPPINGS,
    });
    return true;
  }

  async reindexAll(options?: { recreate?: boolean }): Promise<number> {
    if (!this.elasticsearch) {
      return 0;
    }

    if (options?.recreate) {
      const exists = await this.elasticsearch.indices.exists({ index: COMMENTS_INDEX });
      if (exists) {
        await this.elasticsearch.indices.delete({ index: COMMENTS_INDEX });
      }
    }

    await this.createCommentsIndex();

    let offset = 0;
    let indexed = 0;

    for (;;) {
      const batch = await this.commentsRepository.findBatchForIndex(
        offset,
        COMMENTS_REINDEX_BATCH_SIZE,
      );
      if (batch.length === 0) {
        break;
      }

      const operations = batch.flatMap((comment) => {
        const plainText = toPlainText(comment.text);
        if (!plainText) {
          return [];
        }

        const document: CommentSearchDocument = {
          id: comment.id,
          parentId: comment.parentId,
          username: comment.user.fullName,
          plainText,
          createdAt: comment.createdAt.toISOString(),
        };

        return [{ index: { _index: COMMENTS_INDEX, _id: comment.id } }, document];
      });

      if (operations.length > 0) {
        await this.elasticsearch.bulk({ operations, refresh: false });
        indexed += operations.length / 2;
      }

      if (batch.length < COMMENTS_REINDEX_BATCH_SIZE) {
        break;
      }
      offset += batch.length;
    }

    if (indexed > 0) {
      await this.elasticsearch.indices.refresh({ index: COMMENTS_INDEX });
    }

    this.logger.log(`Elasticsearch reindexed ${String(indexed)} comment(s)`);
    return indexed;
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

    try {
      await this.elasticsearch.index({
        index: COMMENTS_INDEX,
        id,
        document,
        // false: do not block the write path / outbox on every create under load
        refresh: false,
      });
    } catch (error) {
      this.logger.warn(`Elasticsearch index skipped for ${id}: ${formatError(error)}`);
    }
  }

  async search(query: CommentsSearchQuery): Promise<CommentsResult> {
    const needle = toPlainText(query.q);
    if (!needle) {
      return {
        data: [],
        total: 0,
        totalPages: 0,
        status: 'success',
        message: 'Comments fetched successfully',
      };
    }

    if (!this.elasticsearch) {
      return await this.searchInDatabase(needle, query.page, query.limit);
    }

    try {
      const should: estypes.QueryDslQueryContainer[] = [
        {
          multi_match: {
            query: needle,
            fields: ['plainText^3', 'username^3', 'plainText.ngram', 'username.ngram'],
          },
        },
      ];

      if (!needle.includes(' ')) {
        const wildcardPattern = `*${escapeEsWildcard(needle)}*`;
        should.push(
          { wildcard: { plainText: { value: wildcardPattern, case_insensitive: true } } },
          { wildcard: { username: { value: wildcardPattern, case_insensitive: true } } },
        );
      }

      const result = await this.elasticsearch.search<{ id: string }>({
        index: COMMENTS_INDEX,
        from: (query.page - 1) * query.limit,
        size: query.limit,
        query: {
          bool: {
            should,
            minimum_should_match: 1,
          },
        },
      });

      const ids = result.hits.hits
        .map((hit) => hit._source?.id ?? hit._id)
        .filter((id): id is string => Boolean(id));
      const total =
        typeof result.hits.total === 'number' ? result.hits.total : (result.hits.total?.value ?? 0);

      const comments = await this.commentsRepository.findByIds(ids);
      const replyCounts = await this.commentsRepository.countRepliesByRootIds(
        comments.filter((comment) => comment.parentId === null).map((comment) => comment.id),
      );

      this.logger.debug(`search q=${query.q} hits=${String(total)}`);

      return {
        data: comments.map((comment) =>
          toCommentResponse(comment, comment.user, replyCounts.get(comment.id) ?? 0),
        ),
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
        status: 'success',
        message: 'Comments fetched successfully',
      };
    } catch (error) {
      this.logger.warn(
        `Elasticsearch search failed, falling back to PostgreSQL: ${formatError(error)}`,
      );
      return await this.searchInDatabase(needle, query.page, query.limit);
    }
  }

  private async searchInDatabase(
    needle: string,
    page: number,
    limit: number,
  ): Promise<CommentsResult> {
    try {
      const [comments, total] = await this.commentsRepository.searchByText(needle, page, limit);
      const replyCounts = await this.commentsRepository.countRepliesByRootIds(
        comments.filter((comment) => comment.parentId === null).map((comment) => comment.id),
      );
      this.logger.debug(`db fallback search q=${needle} hits=${String(total)}`);
      return {
        data: comments.map((comment) =>
          toCommentResponse(comment, comment.user, replyCounts.get(comment.id) ?? 0),
        ),
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        status: 'success',
        message: 'Comments fetched successfully',
      };
    } catch (error) {
      this.logger.error(`Database fallback search failed: ${formatError(error)}`);
      throw new ServiceUnavailableException(ERROR_MESSAGES.searchUnavailable);
    }
  }
}
