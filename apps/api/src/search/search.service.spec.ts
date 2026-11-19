import type { Client } from '@elastic/elasticsearch';

import type { CommentsRepository } from '@app/comments/repository/comments.repository';

import { SearchService } from './search.service';

describe('SearchService', () => {
  const commentsRepository = {
    findByIds: jest.fn(),
  };

  const elasticsearch = {
    indices: {
      exists: jest.fn(),
      create: jest.fn(),
    },
    index: jest.fn(),
    search: jest.fn(),
  };

  const createService = (client: Client | null = elasticsearch as unknown as Client) =>
    new SearchService(commentsRepository as unknown as CommentsRepository, client);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips index bootstrap when elasticsearch is unavailable', async () => {
    const service = createService(null);

    await expect(service.onModuleInit()).resolves.toBeUndefined();
    expect(elasticsearch.indices.exists).not.toHaveBeenCalled();
  });

  it('creates the comments index when it does not exist', async () => {
    elasticsearch.indices.exists.mockResolvedValue(false);
    elasticsearch.indices.create.mockResolvedValue({});
    const service = createService();

    await service.onModuleInit();

    expect(elasticsearch.indices.exists).toHaveBeenCalledWith({ index: 'comments' });
    expect(elasticsearch.indices.create).toHaveBeenCalledWith(
      expect.objectContaining({ index: 'comments' }),
    );
  });

  it('does not recreate an existing comments index', async () => {
    elasticsearch.indices.exists.mockResolvedValue(true);
    const service = createService();

    await service.onModuleInit();

    expect(elasticsearch.indices.create).not.toHaveBeenCalled();
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
      index: 'comments',
      id: 'c1',
      document: {
        id: 'c1',
        parentId: null,
        username: 'Ann',
        content: 'hello',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      refresh: true,
    });
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

  it('returns an empty page when search has no needle or client', async () => {
    const service = createService(null);

    await expect(service.search({ q: 'hello', page: 1, limit: 25 })).resolves.toEqual({
      data: [],
      total: 0,
      totalPages: 0,
      status: 'success',
      message: 'Comments fetched successfully',
    });
  });

  it('searches elasticsearch and hydrates comments by id order', async () => {
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

    const result = await service.search({ q: 'Hello', page: 2, limit: 10 });

    expect(elasticsearch.search).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 'comments',
        from: 10,
        size: 10,
        query: {
          multi_match: { query: 'hello', fields: ['content', 'username'] },
        },
      }),
    );
    expect(commentsRepository.findByIds).toHaveBeenCalledWith(['c2', 'c1']);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]?.id).toBe('c2');
    expect(result.data[1]?.id).toBe('c1');
  });

  it('supports numeric elasticsearch totals', async () => {
    elasticsearch.search.mockResolvedValue({
      hits: {
        total: 0,
        hits: [],
      },
    });
    commentsRepository.findByIds.mockResolvedValue([]);
    const service = createService();

    await expect(service.search({ q: 'hello', page: 1, limit: 25 })).resolves.toMatchObject({
      total: 0,
      totalPages: 0,
      data: [],
    });
  });
});
