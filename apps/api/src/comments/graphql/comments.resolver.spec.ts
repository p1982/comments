import { Readable } from 'node:stream';

jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

jest.mock('@app/common/guards/auth.guard', () => ({
  AuthGuard: class AuthGuard {},
}));

jest.mock('graphql-upload/GraphQLUpload.mjs', () => ({
  __esModule: true,
  default: {
    parseValue: jest.fn(),
    serialize: jest.fn(),
    parseLiteral: jest.fn(),
  },
}));

jest.mock('@comments/shared', () => ({
  ...jest.requireActual('@comments/shared'),
  commentsSchema: {
    parse: jest.fn((value: unknown) => value),
  },
}));

import type { FileUpload } from 'graphql-upload/processRequest.mjs';

import { CommentResolver } from './comments.resolver';

describe('CommentResolver', () => {
  const commentsService = {
    getComments: jest.fn(),
    getCommentsByRootId: jest.fn(),
    createComment: jest.fn(),
    voteComment: jest.fn(),
  };
  const searchService = {
    search: jest.fn(),
  };
  const resolver = new CommentResolver(commentsService as never, searchService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists comments through the shared list schema', async () => {
    const page = { data: [], status: 'success', message: 'ok' };
    commentsService.getComments.mockResolvedValue(page);

    await expect(resolver.comments({ page: 1, limit: 25 })).resolves.toBe(page);
    expect(commentsService.getComments).toHaveBeenCalledWith(
      {
        page: 1,
        limit: 25,
        sort: 'createdAt',
        order: 'desc',
      },
      null,
    );
  });

  it('loads children by root id', async () => {
    const page = { data: [], status: 'success', message: 'ok' };
    commentsService.getCommentsByRootId.mockResolvedValue(page);

    await expect(resolver.commentChildren('root-1')).resolves.toBe(page);
    expect(commentsService.getCommentsByRootId).toHaveBeenCalledWith('root-1', null);
  });

  it('searches comments and forwards voter key', async () => {
    const page = { data: [], status: 'success', message: 'ok' };
    searchService.search.mockResolvedValue(page);

    await expect(
      resolver.searchComments('hello', 1, 25, { req: { cookies: { voter_id: 'g1' } } as never }),
    ).resolves.toBe(page);
    expect(searchService.search).toHaveBeenCalledWith(
      { q: 'hello', page: 1, limit: 25 },
      'guest:g1',
    );
  });

  it('votes on a comment and sets guest voter cookie when absent', async () => {
    const result = { commentId: 'c1', votesScore: 1, userVote: 1 };
    commentsService.voteComment.mockResolvedValue(result);
    const cookie = jest.fn();

    await expect(
      resolver.voteComment(
        'c1',
        1,
        { req: { cookies: {} } as never, res: { cookie } as never },
        null,
      ),
    ).resolves.toBe(result);

    expect(cookie).toHaveBeenCalledWith(
      'voter_id',
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    );
    expect(commentsService.voteComment).toHaveBeenCalledWith(
      'c1',
      1,
      expect.stringMatching(/^guest:/),
    );

    cookie.mockClear();
    await expect(
      resolver.voteComment('c1', -1, { req: { cookies: {} } as never }, { id: 'u1' } as never),
    ).resolves.toBe(result);
    expect(cookie).not.toHaveBeenCalled();
    expect(commentsService.voteComment).toHaveBeenLastCalledWith('c1', -1, 'user:u1');
  });

  it('creates a comment and forwards uploaded files', async () => {
    const created = { id: 'comment-1', text: 'Hello' };
    commentsService.createComment.mockResolvedValue(created);
    const png = Buffer.from('png');
    const file: FileUpload = {
      filename: 'photo.png',
      mimetype: 'image/png',
      encoding: '7bit',
      createReadStream: () => Readable.from([png]),
    };
    const imageUpload = Promise.resolve(file);

    const result = await resolver.createComment(
      {
        fullName: 'Ann',
        email: 'ann@example.com',
        text: 'Hello',
        captcha: 'AB12C',
        image: imageUpload,
      },
      { req: { cookies: { captcha: 'token' }, user: null } as never },
      null,
    );

    expect(result).toBe(created);
    expect(commentsService.createComment).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Ann',
        email: 'ann@example.com',
        text: 'Hello',
        captcha: 'AB12C',
      }),
      'token',
      null,
      expect.objectContaining({
        originalname: 'photo.png',
        mimetype: 'image/png',
        buffer: png,
      }),
      undefined,
    );
  });
});
