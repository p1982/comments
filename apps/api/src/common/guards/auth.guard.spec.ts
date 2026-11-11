jest.mock('@app/auth/services/jwt.service', () => ({
  TokenService: class TokenService {},
}));

import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';

import type { TokenService } from '@app/auth/services/jwt.service';
import type { UserEntity } from '@app/users/entity/user.entity';
import type { UserRepository } from '@app/users/repository/user.repository';

import { ERROR_MESSAGES } from '../filter/error-messages';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const tokenService = {
    decodeToken: jest.fn(),
  };
  const userRepository = {
    findById: jest.fn(),
  };
  const guard = new AuthGuard(
    tokenService as unknown as TokenService,
    userRepository as unknown as UserRepository,
  );

  const contextFor = (cookies?: { access_token?: string }): ExecutionContext => {
    const request: { cookies?: { access_token?: string }; user?: UserEntity } = {};
    if (cookies !== undefined) {
      request.cookies = cookies;
    }
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([undefined, {}, { access_token: '' }])(
    'allows a request without an access token',
    async (cookies) => {
      await expect(guard.canActivate(contextFor(cookies))).resolves.toBe(true);
      expect(tokenService.decodeToken).not.toHaveBeenCalled();
      expect(userRepository.findById).not.toHaveBeenCalled();
    },
  );

  it('attaches the user from a valid access cookie', async () => {
    const user = { id: 'user-1' } as UserEntity;
    tokenService.decodeToken.mockReturnValue({ id: 'user-1', email: 'a@b.c' });
    userRepository.findById.mockResolvedValue(user);
    const context = contextFor({ access_token: 'token' });
    const request = context.switchToHttp().getRequest<{ user?: UserEntity }>();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(tokenService.decodeToken).toHaveBeenCalledWith('token');
    expect(userRepository.findById).toHaveBeenCalledWith('user-1');
    expect(request.user).toBe(user);
  });

  it('rejects an access cookie whose user does not exist', async () => {
    tokenService.decodeToken.mockReturnValue({ id: 'missing', email: 'a@b.c' });
    userRepository.findById.mockResolvedValue(null);

    await expect(guard.canActivate(contextFor({ access_token: 'token' }))).rejects.toThrow(
      new UnauthorizedException(ERROR_MESSAGES.userNotFound),
    );
  });
});
