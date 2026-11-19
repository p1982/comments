import type { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import type { UsersEntity } from '@app/users/entity/users.entity';

import type { RequestWithUser } from '../guards/auth.guard';
import { resolveRequestUser, UserPipe } from './user.pipe';

jest.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: jest.fn(),
  },
}));

describe('UserPipe', () => {
  const pipe = new UserPipe();

  it('returns the signed-in user from the request', () => {
    const user = { id: 'user-1' } as UsersEntity;

    expect(pipe.transform({ user } as RequestWithUser)).toBe(user);
  });

  it('returns null when the request has no user', () => {
    expect(pipe.transform({} as RequestWithUser)).toBeNull();
    expect(pipe.transform({ user: null } as RequestWithUser)).toBeNull();
  });
});

describe('resolveRequestUser', () => {
  it('reads the user from an http request', () => {
    const user = { id: 'user-1' } as UsersEntity;
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;

    expect(resolveRequestUser(context)).toBe(user);
  });

  it('reads the user from a graphql context', () => {
    const user = { id: 'user-2' } as UsersEntity;
    jest.mocked(GqlExecutionContext).create = jest.fn().mockReturnValue({
      getContext: () => ({ req: { user } }),
    });
    const context = {
      getType: () => 'graphql',
    } as unknown as ExecutionContext;

    expect(resolveRequestUser(context)).toBe(user);
  });
});
