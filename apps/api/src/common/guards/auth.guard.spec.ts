jest.mock('@app/auth/services/jwt.service', () => ({
  TokenService: class TokenService {},
}));

import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import type { TokenService } from '@app/auth/services/jwt.service';
import type { UsersEntity } from '@app/users/entity/users.entity';
import type { UsersRepository } from '@app/users/repository/users.repository';

import { ERROR_MESSAGES } from '../filter/error-messages';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const tokenService = {
    decodeToken: jest.fn(),
  };
  const usersRepository = {
    findById: jest.fn(),
  };
  const guard = new AuthGuard(
    tokenService as unknown as TokenService,
    usersRepository as unknown as UsersRepository,
  );

  const contextFor = (cookies?: { access_token?: string }): ExecutionContext => {
    const request: { cookies?: { access_token?: string }; user?: UsersEntity } = {};
    if (cookies !== undefined) {
      request.cookies = cookies;
    }
    return {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it.each([undefined, {}, { access_token: '' }])(
    'allows a request without an access token',
    async (cookies) => {
      await expect(guard.canActivate(contextFor(cookies))).resolves.toBe(true);
      expect(tokenService.decodeToken).not.toHaveBeenCalled();
      expect(usersRepository.findById).not.toHaveBeenCalled();
    },
  );

  it('attaches the user from a valid access cookie', async () => {
    const user = { id: 'user-1' } as UsersEntity;
    tokenService.decodeToken.mockReturnValue({ id: 'user-1', email: 'a@b.c' });
    usersRepository.findById.mockResolvedValue(user);
    const context = contextFor({ access_token: 'token' });
    const request = context.switchToHttp().getRequest<{ user?: UsersEntity }>();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(tokenService.decodeToken).toHaveBeenCalledWith('token');
    expect(usersRepository.findById).toHaveBeenCalledWith('user-1');
    expect(request.user).toBe(user);
  });

  it('rejects an access cookie whose user does not exist', async () => {
    tokenService.decodeToken.mockReturnValue({ id: 'missing', email: 'a@b.c' });
    usersRepository.findById.mockResolvedValue(null);

    await expect(guard.canActivate(contextFor({ access_token: 'token' }))).rejects.toThrow(
      new UnauthorizedException(ERROR_MESSAGES.userNotFound),
    );
  });

  it('reads the request from a GraphQL context', async () => {
    const request: { cookies?: { access_token?: string }; user?: UsersEntity } = {
      cookies: { access_token: 'token' },
    };
    const user = { id: 'user-1' } as UsersEntity;
    tokenService.decodeToken.mockReturnValue({ id: 'user-1', email: 'a@b.c' });
    usersRepository.findById.mockResolvedValue(user);
    const create = jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: request }),
    } as never);

    const context = {
      getType: () => 'graphql',
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(create).toHaveBeenCalledWith(context);
    expect(request.user).toBe(user);
  });
});
