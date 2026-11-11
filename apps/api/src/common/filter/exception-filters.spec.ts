jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { HttpException, HttpStatus, type ArgumentsHost } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { GraphQLError } from 'graphql';

import { ERROR_CODES, ERROR_MESSAGES } from './error-messages';
import { GlobalExceptionFilter } from './global-exception.filter';
import { createGraphQLErrorFormatter } from './graphql-error.formatter';
import { WebsocketExceptionFilter } from './websocket-exception.filter';

const httpHost = (
  request: { method: string; url: string },
  response: { status: jest.Mock; json: jest.Mock },
) =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  }) as unknown as ArgumentsHost;

describe('exception filters', () => {
  it('maps known HTTP statuses and falls back by status class', () => {
    const format = createGraphQLErrorFormatter({
      get: () => 'development',
    } as unknown as ConfigService);
    const formatted = {
      message: 'fallback',
      path: ['health'],
      locations: [{ line: 1, column: 1 }],
    };

    const badRequest = format(
      formatted,
      new GraphQLError('bad', {
        originalError: new HttpException('Invalid', 400),
      }),
    );
    const unknownClient = format(
      formatted,
      new GraphQLError('bad', {
        originalError: new HttpException('Teapot', 418),
      }),
    );
    const unknownServer = format(
      { message: 'fallback' },
      new GraphQLError('bad', {
        originalError: new HttpException('Down', 503),
      }),
    );

    expect(badRequest.extensions).toMatchObject({ code: ERROR_CODES.BAD_REQUEST, statusCode: 400 });
    expect(unknownClient.extensions).toMatchObject({ code: ERROR_CODES.BAD_REQUEST });
    expect(unknownServer.extensions).toMatchObject({ code: ERROR_CODES.INTERNAL_SERVER_ERROR });
    expect(badRequest.path).toEqual(['health']);
    expect(badRequest.locations).toEqual([{ line: 1, column: 1 }]);
  });

  it('hides unexpected GraphQL errors in production and shows them otherwise', () => {
    const production = createGraphQLErrorFormatter({
      get: () => 'production',
    } as unknown as ConfigService);
    const development = createGraphQLErrorFormatter({
      get: () => 'development',
    } as unknown as ConfigService);

    expect(production({ message: 'formatted' }, new Error('secret')).message).toBe(
      ERROR_MESSAGES.internalServerError,
    );
    expect(development({ message: 'formatted' }, 'not-an-error').message).toBe('formatted');
    expect(development({ message: 'formatted' }, new Error('secret')).message).toBe('secret');
  });

  it('writes HTTP errors from a string, an object, an Error, and an unknown value', () => {
    const filter = new GlobalExceptionFilter();
    const request = { method: 'GET', url: '/comments' };

    const cases: Array<{ error: unknown; message: string | string[]; status: number }> = [
      { error: new HttpException('Missing', 400), message: 'Missing', status: 400 },
      {
        error: new HttpException({ message: ['bad name'] }, 422),
        message: ['bad name'],
        status: 422,
      },
      { error: new Error('boom'), message: 'boom', status: HttpStatus.INTERNAL_SERVER_ERROR },
      { error: 'nope', message: ERROR_MESSAGES.internalServerError, status: 500 },
    ];

    for (const item of cases) {
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      filter.catch(item.error, httpHost(request, { status, json }));
      expect(status).toHaveBeenCalledWith(item.status);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: item.status,
          path: '/comments',
          message: item.message,
        }),
      );
    }
  });

  it('turns websocket failures into WsException payloads', () => {
    const filter = new WebsocketExceptionFilter();
    const host = {} as ArgumentsHost;
    const passthrough = jest
      .spyOn(BaseWsExceptionFilter.prototype, 'catch')
      .mockImplementation(() => undefined);
    const existing = new WsException('already wrapped');

    filter.catch(existing, host);
    filter.catch(new Error('socket down'), host);
    filter.catch('unknown', host);

    expect(passthrough).toHaveBeenNthCalledWith(1, existing, host);
    expect(passthrough).toHaveBeenNthCalledWith(2, expect.any(WsException), host);
    expect(passthrough).toHaveBeenNthCalledWith(3, expect.any(WsException), host);
    passthrough.mockRestore();
  });
});
