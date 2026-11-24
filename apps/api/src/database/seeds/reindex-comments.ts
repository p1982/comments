import { Client } from '@elastic/elasticsearch';
import { Logger } from '@nestjs/common';

import { CommentsEntity } from '@app/comments/entity/comments.entity';
import { toPlainText } from '@app/comments/helpers/to-plain-text';
import dataSource from '@app/database/data-source';
import {
  COMMENTS_INDEX,
  COMMENTS_INDEX_MAPPINGS,
  COMMENTS_INDEX_SETTINGS,
  COMMENTS_REINDEX_BATCH_SIZE,
} from '@app/search/search.constants';
import type { CommentSearchDocument } from '@app/search/search.types';

const logger = new Logger('SearchReindex');

const createClient = (): Client => {
  const node = process.env['ELASTICSEARCH_NODE'];
  if (!node) {
    throw new Error('ELASTICSEARCH_NODE is not set in environment');
  }

  const username = process.env['ELASTICSEARCH_USERNAME'];
  const password = process.env['ELASTICSEARCH_PASSWORD'];

  return new Client({
    node,
    ...(username && password ? { auth: { username, password } } : {}),
  });
};

const run = async (): Promise<void> => {
  const client = createClient();
  await dataSource.initialize();

  try {
    const exists = await client.indices.exists({ index: COMMENTS_INDEX });
    if (exists) {
      await client.indices.delete({ index: COMMENTS_INDEX });
      logger.log(`Deleted existing index ${COMMENTS_INDEX}`);
    }

    await client.indices.create({
      index: COMMENTS_INDEX,
      settings: COMMENTS_INDEX_SETTINGS,
      mappings: COMMENTS_INDEX_MAPPINGS,
    });
    logger.log(`Created index ${COMMENTS_INDEX} with ngram analyzer`);

    const repo = dataSource.getRepository(CommentsEntity);
    let offset = 0;
    let indexed = 0;

    for (;;) {
      const batch = await repo.find({
        relations: { user: true },
        order: { createdAt: 'ASC', id: 'ASC' },
        skip: offset,
        take: COMMENTS_REINDEX_BATCH_SIZE,
      });

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
        const response = await client.bulk({ operations, refresh: false });
        if (response.errors) {
          logger.warn(`Some documents failed during bulk index at offset ${String(offset)}`);
        }
        indexed += operations.length / 2;
      }

      if (batch.length < COMMENTS_REINDEX_BATCH_SIZE) {
        break;
      }
      offset += batch.length;
    }

    if (indexed > 0) {
      await client.indices.refresh({ index: COMMENTS_INDEX });
    }

    logger.log(`Reindexed ${String(indexed)} comment(s) into ${COMMENTS_INDEX}`);
  } finally {
    await dataSource.destroy();
    await client.close();
  }
};

void run().catch((error: unknown) => {
  logger.error(error);
  process.exitCode = 1;
});
