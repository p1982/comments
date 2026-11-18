jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import type { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { HashService } from './hash.service';

describe('HashService', () => {
  const configService = {
    get: jest.fn().mockReturnValue(10),
  };
  const service = new HashService(configService as unknown as ConfigService);

  beforeEach(() => {
    jest.clearAllMocks();
    configService.get.mockReturnValue(10);
  });

  it('hashes a password with the configured salt rounds', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    await expect(service.hashPassword('secret')).resolves.toBe('hashed');
    expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
  });

  it('compares a password to a hash', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(service.comparePassword('secret', 'hashed')).resolves.toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith('secret', 'hashed');
  });
});
