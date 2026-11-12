jest.mock('@app/auth/services/jwt.service', () => ({
  TokenService: class TokenService {},
}));

import type { CommentsSchema } from '@comments/shared';

import type { UsersEntity } from '@app/users/entity/users.entity';
import type { RequestWithUser } from '@app/common/guards/auth.guard';

import { CommentsController } from './comments.controller';
import type { CommentsService } from './comments.service';

describe('CommentsController', () => {
  const commentsService = { createComment: jest.fn(), getComments: jest.fn() };
  const controller = new CommentsController(commentsService as unknown as CommentsService);
  const body = {
    fullName: 'Ann',
    email: 'ann@example.com',
    text: 'Hello',
  } as CommentsSchema;

  it('creates a comment without a signed-in user', async () => {
    commentsService.createComment.mockResolvedValue({ id: '1' });

    await controller.createComment({} as RequestWithUser, body);

    expect(commentsService.createComment).toHaveBeenCalledWith(body, null);
  });

  it('passes the signed-in user through', async () => {
    const user = { id: 'user-1' } as UsersEntity;
    commentsService.createComment.mockResolvedValue({ id: '1' });

    await controller.createComment({ user } as RequestWithUser, body);

    expect(commentsService.createComment).toHaveBeenCalledWith(body, user);
  });

  it('passes the list query to the service', async () => {
    const query = { page: 2, limit: 25, sort: 'email' as const, order: 'asc' as const };
    commentsService.getComments.mockResolvedValue([]);

    await expect(controller.getComments(query)).resolves.toEqual([]);
    expect(commentsService.getComments).toHaveBeenCalledWith(query);
  });
});
