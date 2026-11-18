jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

jest.mock('./services/auth.service', () => ({
  AuthService: class AuthService {},
}));

jest.mock('./services/jwt.service', () => ({
  TokenService: class TokenService {},
}));

import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { CookiesName } from '@comments/shared';
import { ERROR_MESSAGES } from '@app/common/filter/error-messages';

import { AuthController } from './auth.controller';
import type { AuthService } from './services/auth.service';

describe('AuthController', () => {
  const signUp = jest.fn();
  const signIn = jest.fn();
  const refresh = jest.fn();
  const cookie = jest.fn();
  const authService = { signUp, signIn, refresh };
  const configService = {
    get: jest.fn((_key: string, fallback?: number) => fallback),
  };
  const controller = new AuthController(
    authService as unknown as AuthService,
    configService as unknown as ConfigService,
  );
  const response = { cookie } as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
    signUp.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    signIn.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    refresh.mockResolvedValue({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
    });
  });

  it('signs up and sets auth cookies', async () => {
    const body = {
      email: 'auth@example.com',
      password: 'password123',
      fullName: 'Ann',
    };

    await expect(controller.signUp(body, response)).resolves.toEqual({ status: 'success' });
    expect(signUp).toHaveBeenCalledWith(body);
    expect(cookie).toHaveBeenCalledWith(
      CookiesName.ACCESS_TOKEN,
      'access',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
    expect(cookie).toHaveBeenCalledWith(
      CookiesName.REFRESH_TOKEN,
      'refresh',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('signs in and sets auth cookies', async () => {
    const body = { email: 'auth@example.com', password: 'password123' };

    await expect(controller.signIn(body, response)).resolves.toEqual({ status: 'success' });
    expect(signIn).toHaveBeenCalledWith(body);
    expect(cookie).toHaveBeenCalledTimes(2);
  });

  it('refreshes from the refresh cookie', async () => {
    const request = {
      cookies: { [CookiesName.REFRESH_TOKEN]: 'refresh-cookie' },
    } as unknown as Request;

    await expect(controller.refresh(request, response)).resolves.toEqual({ status: 'success' });
    expect(refresh).toHaveBeenCalledWith('refresh-cookie');
    expect(cookie).toHaveBeenCalledWith(CookiesName.ACCESS_TOKEN, 'access-2', expect.any(Object));
  });

  it('rejects refresh without a refresh cookie', async () => {
    const request = { cookies: {} } as unknown as Request;

    await expect(controller.refresh(request, response)).rejects.toThrow(
      new UnauthorizedException(ERROR_MESSAGES.unauthorized),
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
