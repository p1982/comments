jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {
    get(_key: string, fallback?: string) {
      return fallback;
    }
  },
}));

import { ConfigService } from '@nestjs/config';

import { getDataSource } from '../database/data-source';
import { getTypeOrmConfig } from './db';

const configWith = (values: Record<string, string | undefined>) =>
  ({
    get: (key: string, fallback?: string) => values[key] ?? fallback,
  }) as unknown as ConfigService;

describe('database config', () => {
  it('uses a database url when one is configured', () => {
    const options = getTypeOrmConfig(
      configWith({ NODE_ENV: 'production', DATABASE_URL: 'postgres://db' }),
    );

    expect(options).toMatchObject({
      type: 'postgres',
      url: 'postgres://db',
      synchronize: false,
      logging: false,
    });
  });

  it('uses discrete connection fields outside production', () => {
    const options = getTypeOrmConfig(
      configWith({
        NODE_ENV: 'development',
        DB_HOST: 'db',
        DB_PORT: '5433',
        DB_USERNAME: 'comments',
        DB_PASSWORD: 'secret',
        DB_DATABASE: 'comments',
      }),
    );

    expect(options).toMatchObject({
      host: 'db',
      port: '5433',
      username: 'comments',
      password: 'secret',
      database: 'comments',
      synchronize: true,
      logging: true,
    });
  });

  it('builds the TypeORM data source from DB_* variables', () => {
    const options = getDataSource(
      configWith({
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_USER: 'postgres',
        DB_PASSWORD: '1',
        DB_NAME: 'comments',
      }),
    );

    expect(options).toMatchObject({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      database: 'comments',
      synchronize: false,
    });
    expect(options.entities).toHaveLength(4);
  });
});
