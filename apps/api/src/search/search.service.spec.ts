import type { Client } from '@elastic/elasticsearch';
import { ServiceUnavailableException } from '@nestjs/common';

import type { CommentsRepository } from '@app/comments/repository/comments.repository';
import { ERROR_MESSAGES } from '@app/common/filter/error-messages';
import {
  COMMENTS_INDEX,
  COMMENTS_INDEX_MAPPINGS,
  COMMENTS_INDEX_SETTINGS,
  COMMENTS_REINDEX_BATCH_SIZE,
} from '@app/search/search.constants';

import { SearchService } from './search.service';

describe('SearchService', () => {
  const commentsRepository = {
    findByIds: jest.fn(),
    searchByText: jest.fn(),
    findBatchForIndex: jest.fn(),
    countRepliesByRootIds: jest.fn(),
  };

  const elasticsearch = {
    indices: {
      exists: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      refresh: jest.fn(),
    },
    count: jest.fn(),
    bulk: jest.fn(),
    index: jest.fn(),
    search: jest.fn(),
  };

  const createService = (client: Client | null = elasticsearch as unknown as Client) =>
    new SearchService(commentsRepository as unknown as CommentsRepository, client);

  const sampleComment = {
    id: 'c1',
    text: 'load comment 8000014',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    parentId: null,
    user: { fullName: 'LoadUser8000014', email: 'load@example.com', homepage: null },
    attachments: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    commentsRepository.countRepliesByRootIds.mockResolvedValue(new Map());
  });

  it('skips index bootstrap when elasticsearch is unavailable', async () => {
    const service = createService(null);

    await expect(service.onModuleInit()).resolves.toBeUndefined();
    expect(elasticsearch.indices.exists).not.toHaveBeenCalled();
  });

  it('creates the comments index with ngram settings and auto-reindexes when missing', async () => {
    elasticsearch.indices.exists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    elasticsearch.indices.create.mockResolvedValue({});
    commentsRepository.findBatchForIndex.mockResolvedValue([sampleComment]);
    elasticsearch.bulk.mockResolvedValue({ errors: false });
    elasticsearch.indices.refresh.mockResolvedValue({});
    const service = createService();

    await service.onModuleInit();

    expect(elasticsearch.indices.exists).toHaveBeenCalledWith({ index: COMMENTS_INDEX });
    expect(elasticsearch.indices.create).toHaveBeenCalledWith({
      index: COMMENTS_INDEX,
      settings: COMMENTS_INDEX_SETTINGS,
      mappings: COMMENTS_INDEX_MAPPINGS,
    });
    expect(elasticsearch.bulk).toHaveBeenCalledWith({
      operations: [
        { index: { _index: COMMENTS_INDEX, _id: 'c1' } },
        {
          id: 'c1',
          parentId: null,
          username: 'LoadUser8000014',
          plainText: 'load comment 8000014',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      refresh: false,
    });
    expect(elasticsearch.indices.refresh).toHaveBeenCalledWith({ index: COMMENTS_INDEX });
  });

  it('does not recreate or reindex when comments index already has documents', async () => {
    elasticsearch.indices.exists.mockResolvedValue(true);
    elasticsearch.count.mockResolvedValue({ count: 10 });
    const service = createService();

    await service.onModuleInit();

    expect(elasticsearch.indices.create).not.toHaveBeenCalled();
    expect(commentsRepository.findBatchForIndex).not.toHaveBeenCalled();
  });

  it('auto-reindexes when an existing comments index is empty', async () => {
    elasticsearch.indices.exists.mockResolvedValue(true);
    elasticsearch.count.mockResolvedValue({ count: 0 });
    commentsRepository.findBatchForIndex.mockResolvedValue([]);
    const service = createService();

    await service.onModuleInit();

    expect(commentsRepository.findBatchForIndex).toHaveBeenCalledWith(
      0,
      COMMENTS_REINDEX_BATCH_SIZE,
    );
    expect(elasticsearch.indices.refresh).not.toHaveBeenCalled();
  });

  it('swallows errors during index bootstrap', async () => {
    elasticsearch.indices.exists.mockRejectedValue(new Error('ECONNREFUSED'));
    const service = createService();

    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });

  it('recreates the index and bulk-reindexes batches when recreate is requested', async () => {
    const emptyTextComment = { ...sampleComment, id: 'c-empty', text: '<i></i>' };
    const fullBatch = Array.from({ length: COMMENTS_REINDEX_BATCH_SIZE }, (_, idx) => ({
      ...sampleComment,
      id: `c-${String(idx)}`,
    }));

    elasticsearch.indices.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    elasticsearch.indices.delete.mockResolvedValue({});
    elasticsearch.indices.create.mockResolvedValue({});
    commentsRepository.findBatchForIndex
      .mockResolvedValueOnce(fullBatch)
      .mockResolvedValueOnce([emptyTextComment]);
    elasticsearch.bulk.mockResolvedValue({ errors: false });
    elasticsearch.indices.refresh.mockResolvedValue({});

    const service = createService();
    const count = await service.reindexAll({ recreate: true });

    expect(count).toBe(COMMENTS_REINDEX_BATCH_SIZE);
    expect(elasticsearch.indices.delete).toHaveBeenCalledWith({ index: COMMENTS_INDEX });
    expect(elasticsearch.indices.create).toHaveBeenCalledTimes(1);
    expect(commentsRepository.findBatchForIndex).toHaveBeenNthCalledWith(
      1,
      0,
      COMMENTS_REINDEX_BATCH_SIZE,
    );
    expect(commentsRepository.findBatchForIndex).toHaveBeenNthCalledWith(
      2,
      COMMENTS_REINDEX_BATCH_SIZE,
      COMMENTS_REINDEX_BATCH_SIZE,
    );
    expect(elasticsearch.bulk).toHaveBeenCalledTimes(1);
    expect(elasticsearch.indices.refresh).toHaveBeenCalledWith({ index: COMMENTS_INDEX });
  });

  it('returns 0 from reindexAll when elasticsearch client is missing', async () => {
    const service = createService(null);

    await expect(service.reindexAll()).resolves.toBe(0);
  });

  it('indexes a comment document', async () => {
    elasticsearch.index.mockResolvedValue({});
    const service = createService();

    await service.index({
      id: 'c1',
      parentId: null,
      fullName: 'Ann',
      text: '<strong>Hello</strong>',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    expect(elasticsearch.index).toHaveBeenCalledWith({
      index: COMMENTS_INDEX,
      id: 'c1',
      document: {
        id: 'c1',
        parentId: null,
        username: 'Ann',
        plainText: 'hello',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      refresh: false,
    });
  });

  it('does not throw when elasticsearch index fails', async () => {
    elasticsearch.index.mockRejectedValue(new Error('media_type_header_exception'));
    const service = createService();

    await expect(
      service.index({
        id: 'c1',
        parentId: null,
        fullName: 'Ann',
        text: 'Hello',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    ).resolves.toBeUndefined();
  });

  it('skips indexing empty plain text or missing client', async () => {
    const withClient = createService();
    await withClient.index({
      id: 'c1',
      parentId: null,
      fullName: 'Ann',
      text: '<i></i>',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(elasticsearch.index).not.toHaveBeenCalled();

    const withoutClient = createService(null);
    await withoutClient.index({
      id: 'c1',
      parentId: null,
      fullName: 'Ann',
      text: 'Hello',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(elasticsearch.index).not.toHaveBeenCalled();
  });

  it('returns an empty page when search has no needle', async () => {
    const service = createService();

    await expect(service.search({ q: '<i></i>', page: 1, limit: 25 })).resolves.toEqual({
      data: [],
      total: 0,
      totalPages: 0,
      status: 'success',
      message: 'Comments fetched successfully',
    });
    expect(elasticsearch.search).not.toHaveBeenCalled();
    expect(commentsRepository.searchByText).not.toHaveBeenCalled();
  });

  it('falls back to PostgreSQL when elasticsearch client is missing', async () => {
    commentsRepository.searchByText.mockResolvedValue([[sampleComment], 1]);
    const service = createService(null);

    const result = await service.search({ q: '8000014', page: 1, limit: 25 });

    expect(commentsRepository.searchByText).toHaveBeenCalledWith('8000014', 1, 25);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.data[0]?.id).toBe('c1');
  });

  it('searches elasticsearch with ngram and wildcard for substring matching and hydrates by id order', async () => {
    elasticsearch.search.mockResolvedValue({
      hits: {
        total: { value: 2 },
        hits: [{ _source: { id: 'c2' } }, { _id: 'c1' }],
      },
    });
    const commentA = {
      id: 'c2',
      text: 'second',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
      parentId: null,
      user: { fullName: 'Bob', email: 'bob@example.com', homepage: null },
      attachments: [],
    };
    const commentB = {
      id: 'c1',
      text: 'first',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      parentId: null,
      user: { fullName: 'Ann', email: 'ann@example.com', homepage: null },
      attachments: [],
    };
    commentsRepository.findByIds.mockResolvedValue([commentA, commentB]);
    const service = createService();

    const result = await service.search({ q: '14*', page: 2, limit: 10 });

    expect(elasticsearch.search).toHaveBeenCalledWith({
      index: COMMENTS_INDEX,
      from: 10,
      size: 10,
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query: '14*',
                fields: ['plainText^3', 'username^3', 'plainText.ngram', 'username.ngram'],
              },
            },
            { wildcard: { plainText: { value: '*14\\**', case_insensitive: true } } },
            { wildcard: { username: { value: '*14\\**', case_insensitive: true } } },
          ],
          minimum_should_match: 1,
        },
      },
    });
    expect(commentsRepository.findByIds).toHaveBeenCalledWith(['c2', 'c1']);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]?.id).toBe('c2');
    expect(result.data[1]?.id).toBe('c1');
  });

  it('uses multi_match without wildcard for multi-word queries and supports numeric totals', async () => {
    elasticsearch.search.mockResolvedValue({
      hits: {
        total: 0,
        hits: [],
      },
    });
    commentsRepository.findByIds.mockResolvedValue([]);
    const service = createService();

    await expect(service.search({ q: 'load 8000', page: 1, limit: 25 })).resolves.toMatchObject({
      total: 0,
      totalPages: 0,
      data: [],
    });
    expect(elasticsearch.search).toHaveBeenCalledWith({
      index: COMMENTS_INDEX,
      from: 0,
      size: 25,
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query: 'load 8000',
                fields: ['plainText^3', 'username^3', 'plainText.ngram', 'username.ngram'],
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
    });
  });

  it('falls back to PostgreSQL when elasticsearch search fails', async () => {
    const connectionError = new Error('');
    connectionError.name = 'ConnectionError';
    elasticsearch.search.mockRejectedValueOnce(connectionError);
    elasticsearch.search.mockRejectedValueOnce('socket hang up');
    commentsRepository.searchByText
      .mockResolvedValueOnce([[sampleComment], 1])
      .mockResolvedValueOnce([[], 0]);
    const service = createService();

    const found = await service.search({ q: '8000014', page: 1, limit: 25 });
    expect(commentsRepository.searchByText).toHaveBeenCalledWith('8000014', 1, 25);
    expect(found.total).toBe(1);
    expect(found.data[0]?.id).toBe('c1');

    const empty = await service.search({ q: 'missing', page: 1, limit: 25 });
    expect(empty.total).toBe(0);
    expect(empty.totalPages).toBe(0);
  });

  it('throws a user-friendly ServiceUnavailableException when both elasticsearch and database fail', async () => {
    elasticsearch.search.mockRejectedValue(new Error('connect ECONNREFUSED'));
    commentsRepository.searchByText.mockRejectedValue(new Error('db down'));
    const service = createService();

    await expect(service.search({ q: '8000014', page: 1, limit: 25 })).rejects.toThrow(
      new ServiceUnavailableException(ERROR_MESSAGES.searchUnavailable),
    );
  });
});
