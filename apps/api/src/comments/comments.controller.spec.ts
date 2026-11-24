jest.mock('@app/auth/services/jwt.service', () => ({
  TokenService: class TokenService {},
}));

jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import type { CommentsSchema } from '@comments/shared';
import type { UsersEntity } from '@app/users/entity/users.entity';
import type { RequestWithUser } from '@app/common/guards/auth.guard';

import { CommentsController } from './comments.controller';
import type { CommentsService } from './comments.service';

describe('CommentsController', () => {
  const commentsService = {
    createComment: jest.fn(),
    getComments: jest.fn(),
    getCommentsByRootId: jest.fn(),
    voteComment: jest.fn(),
  };
  const searchService = {
    search: jest.fn(),
  };
  const controller = new CommentsController(
    commentsService as unknown as CommentsService,
    searchService as never,
  );
  const body = {
    fullName: 'Ann',
    email: 'ann@example.com',
    text: 'Hello',
    captcha: 'AB12C',
  } as CommentsSchema;

  it('creates a comment without a signed-in user', async () => {
    commentsService.createComment.mockResolvedValue({ id: '1' });

    await controller.createComment(null, {} as RequestWithUser, body);

    expect(commentsService.createComment).toHaveBeenCalledWith(
      body,
      null,
      null,
      undefined,
      undefined,
    );
  });

  it('passes the signed-in user and captcha cookie through', async () => {
    const user = { id: 'user-1' } as UsersEntity;
    commentsService.createComment.mockResolvedValue({ id: '1' });

    await controller.createComment(
      user,
      { cookies: { captcha: 'signed-token' } } as RequestWithUser,
      body,
    );

    expect(commentsService.createComment).toHaveBeenCalledWith(
      body,
      'signed-token',
      user,
      undefined,
      undefined,
    );
  });

  it('passes the text file through', async () => {
    const textFile = { originalname: 'note.txt' } as Express.Multer.File;
    commentsService.createComment.mockResolvedValue({ id: '1' });

    await controller.createComment(null, {} as RequestWithUser, body, { textFile: [textFile] });

    expect(commentsService.createComment).toHaveBeenCalledWith(
      body,
      null,
      null,
      undefined,
      textFile,
    );
  });

  it('passes the root id to the service', async () => {
    const thread = { data: [], status: 'success' as const, message: 'ok' };
    commentsService.getCommentsByRootId.mockResolvedValue(thread);

    await expect(controller.getCommentsByRootId('root-1')).resolves.toEqual(thread);
    expect(commentsService.getCommentsByRootId).toHaveBeenCalledWith('root-1', null);
  });

  it('passes the list query and voter key to the service', async () => {
    const query = { page: 2, limit: 25, sort: 'email' as const, order: 'asc' as const };
    const page = { data: [], status: 'success' as const, message: 'ok' };
    commentsService.getComments.mockResolvedValue(page);

    await expect(
      controller.getComments(query, null, { cookies: { voter_id: 'guest-1' } } as RequestWithUser),
    ).resolves.toEqual(page);
    expect(commentsService.getComments).toHaveBeenCalledWith(query, 'guest:guest-1');
  });

  it('passes search query and voter key to the search service', async () => {
    const query = { q: 'hello', page: 1, limit: 25 };
    const page = { data: [], status: 'success' as const, message: 'ok' };
    searchService.search.mockResolvedValue(page);

    await expect(
      controller.searchComments(query, { id: 'u1' } as UsersEntity, {} as RequestWithUser),
    ).resolves.toEqual(page);
    expect(searchService.search).toHaveBeenCalledWith(query, 'user:u1');
  });

  it('votes as a guest and issues a voter_id cookie when absent', async () => {
    const voteResult = { commentId: 'c1', votesScore: 1, userVote: 1 as const };
    commentsService.voteComment.mockResolvedValue(voteResult);
    const cookie = jest.fn();

    await expect(
      controller.voteComment('c1', null, { cookies: {} } as RequestWithUser, { cookie } as never, {
        value: 1,
      }),
    ).resolves.toEqual(voteResult);

    expect(cookie).toHaveBeenCalledWith(
      'voter_id',
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
    expect(commentsService.voteComment).toHaveBeenCalledWith(
      'c1',
      1,
      expect.stringMatching(/^guest:/),
    );
  });

  it('votes as an authenticated user without setting a guest cookie', async () => {
    const voteResult = { commentId: 'c1', votesScore: -1, userVote: -1 as const };
    commentsService.voteComment.mockResolvedValue(voteResult);
    const cookie = jest.fn();

    await expect(
      controller.voteComment(
        'c1',
        { id: 'u1' } as UsersEntity,
        { cookies: {} } as RequestWithUser,
        { cookie } as never,
        { value: -1 },
      ),
    ).resolves.toEqual(voteResult);

    expect(cookie).not.toHaveBeenCalled();
    expect(commentsService.voteComment).toHaveBeenCalledWith('c1', -1, 'user:u1');
  });
});
