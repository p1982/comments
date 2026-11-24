import { HttpException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { GraphQLError } from 'graphql';

import { ERROR_CODES, ERROR_MESSAGES } from '../common/filter/error-messages';
import { buildGraphQLOptions } from './graphql.options';

describe('buildGraphQLOptions', () => {
  it('wires formatError with extensions.code for HttpException', () => {
    const options = buildGraphQLOptions({
      get: () => 'development',
    } as unknown as ConfigService);

    const formatted = options.formatError?.(
      { message: 'fallback' },
      new GraphQLError('bad', {
        originalError: new HttpException('Invalid captcha', 400),
      }),
    );

    expect(options.autoSchemaFile).toEqual(expect.stringContaining('apps/api/schema.gql'));
    expect(options.introspection).toBe(true);
    expect(options.playground).toEqual({
      settings: {
        'request.credentials': 'include',
      },
    });
    expect(formatted).toMatchObject({
      message: 'Invalid captcha',
      extensions: {
        code: ERROR_CODES.BAD_REQUEST,
        statusCode: 400,
      },
    });
    expect(formatted).not.toHaveProperty('extensions.stacktrace');
    expect(formatted).not.toHaveProperty('extensions.exception');
  });

  it('hides unexpected errors in production while keeping Playground enabled by default', () => {
    const options = buildGraphQLOptions({
      get: (key: string) => (key === 'NODE_ENV' ? 'production' : undefined),
    } as unknown as ConfigService);

    const formatted = options.formatError?.(
      { message: 'formatted' },
      new Error('secret db password'),
    );

    expect(options.autoSchemaFile).toBe(true);
    expect(options.introspection).toBe(true);
    expect(options.playground).toEqual({
      settings: {
        'request.credentials': 'include',
      },
    });
    expect(formatted).toEqual({
      message: ERROR_MESSAGES.internalServerError,
      extensions: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      },
    });
    expect(JSON.stringify(formatted)).not.toContain('secret');
  });

  it('disables Playground and introspection when GRAPHQL_PLAYGROUND=false', () => {
    const options = buildGraphQLOptions({
      get: (key: string) => {
        if (key === 'NODE_ENV') {
          return 'production';
        }
        if (key === 'GRAPHQL_PLAYGROUND') {
          return 'false';
        }
        return undefined;
      },
    } as unknown as ConfigService);

    expect(options.introspection).toBe(false);
    expect(options.playground).toBe(false);
  });
});
