jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

jest.mock('./jwt.service', () => ({
  TokenService: class TokenService {},
}));

jest.mock('./hash.service', () => ({
  HashService: class HashService {},
}));

import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import { ERROR_MESSAGES } from '@app/common/filter/error-messages';
import type { UsersEntity } from '@app/users/entity/users.entity';
import type { UsersRepository } from '@app/users/repository/users.repository';

import { AuthService } from './auth.service';
import type { HashService } from './hash.service';
import type { TokenService } from './jwt.service';

describe('AuthService', () => {
  const userRepository = {
    findByEmailForAuth: jest.fn(),
    findById: jest.fn(),
    createWithPassword: jest.fn(),
  };
  const hashService = {
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
  };
  const tokenService = {
    generateToken: jest.fn(),
    verifyToken: jest.fn(),
  };
  const configService = {
    get: jest.fn((_key: string, fallback?: string) => fallback),
  };

  const service = new AuthService(
    userRepository as unknown as UsersRepository,
    hashService as unknown as HashService,
    tokenService as unknown as TokenService,
    configService as unknown as ConfigService,
  );

  const user = {
    id: 'user-1',
    email: 'auth@example.com',
    fullName: 'Ann',
    passwordHash: 'hashed',
    deletedAt: null,
  } as UsersEntity;

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.generateToken
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
  });

  describe('signUp', () => {
    it('creates a user and returns a token pair', async () => {
      userRepository.findByEmailForAuth.mockResolvedValue(null);
      hashService.hashPassword.mockResolvedValue('hashed');
      userRepository.createWithPassword.mockResolvedValue(user);

      await expect(
        service.signUp({
          email: 'auth@example.com',
          password: 'password123',
          fullName: 'Ann',
          homepage: 'https://ann.example',
        }),
      ).resolves.toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      expect(hashService.hashPassword).toHaveBeenCalledWith('password123');
      expect(userRepository.createWithPassword).toHaveBeenCalledWith({
        email: 'auth@example.com',
        fullName: 'Ann',
        passwordHash: 'hashed',
        homepage: 'https://ann.example',
      });
      expect(tokenService.generateToken).toHaveBeenCalledTimes(2);
    });

    it('rejects when the email is already registered', async () => {
      userRepository.findByEmailForAuth.mockResolvedValue(user);

      await expect(
        service.signUp({
          email: 'auth@example.com',
          password: 'password123',
          fullName: 'Ann',
        }),
      ).rejects.toThrow(new ConflictException(ERROR_MESSAGES.emailTaken));
      expect(userRepository.createWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    it('returns tokens for a valid password', async () => {
      userRepository.findByEmailForAuth.mockResolvedValue(user);
      hashService.comparePassword.mockResolvedValue(true);

      await expect(
        service.signIn({ email: 'auth@example.com', password: 'password123' }),
      ).resolves.toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(hashService.comparePassword).toHaveBeenCalledWith('password123', 'hashed');
    });

    it('rejects unknown users with the same credentials error', async () => {
      userRepository.findByEmailForAuth.mockResolvedValue(null);

      await expect(
        service.signIn({ email: 'missing@example.com', password: 'password123' }),
      ).rejects.toThrow(new UnauthorizedException(ERROR_MESSAGES.invalidCredentials));
    });

    it('rejects users without a password hash', async () => {
      userRepository.findByEmailForAuth.mockResolvedValue({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        passwordHash: null,
        deletedAt: null,
      });

      await expect(
        service.signIn({ email: 'auth@example.com', password: 'password123' }),
      ).rejects.toThrow(new UnauthorizedException(ERROR_MESSAGES.invalidCredentials));
    });

    it('rejects an invalid password', async () => {
      userRepository.findByEmailForAuth.mockResolvedValue(user);
      hashService.comparePassword.mockResolvedValue(false);

      await expect(
        service.signIn({ email: 'auth@example.com', password: 'wrong' }),
      ).rejects.toThrow(new UnauthorizedException(ERROR_MESSAGES.invalidCredentials));
    });
  });

  describe('refresh', () => {
    it('issues a new pair for a valid refresh token', async () => {
      tokenService.verifyToken.mockResolvedValue({ id: 'user-1', email: 'auth@example.com' });
      userRepository.findById.mockResolvedValue(user);

      await expect(service.refresh('refresh-cookie')).resolves.toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(tokenService.verifyToken).toHaveBeenCalledWith('refresh-cookie');
    });

    it('rejects when an access token is submitted to refresh', async () => {
      tokenService.verifyToken.mockResolvedValue({
        id: 'user-1',
        email: 'auth@example.com',
        type: 'access',
      });

      await expect(service.refresh('access-cookie')).rejects.toThrow(
        new UnauthorizedException(ERROR_MESSAGES.unauthorized),
      );
      expect(userRepository.findById).not.toHaveBeenCalled();
    });

    it('rejects when the refresh user no longer exists', async () => {
      tokenService.verifyToken.mockResolvedValue({ id: 'missing', email: 'a@b.c' });
      userRepository.findById.mockResolvedValue(null);

      await expect(service.refresh('refresh-cookie')).rejects.toThrow(
        new UnauthorizedException(ERROR_MESSAGES.userNotFound),
      );
    });
  });
});
