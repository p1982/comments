import { HttpAdapterHost } from '@nestjs/core';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { DataSource } from 'typeorm';

import { HealthService } from './health.service';

const schemaWithHealth = (value: string | Error): GraphQLSchema =>
  new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        health: {
          type: GraphQLString,
          resolve: () => {
            if (value instanceof Error) {
              throw value;
            }
            return value;
          },
        },
      },
    }),
  });

describe('HealthService', () => {
  const dataSource = { query: jest.fn() };
  const schemaHost: { schema?: GraphQLSchema } = {};
  const httpServer = { listeners: jest.fn() };
  const httpAdapterHost: { httpAdapter?: { getHttpServer: jest.Mock } } = {};
  const service = new HealthService(
    dataSource as unknown as DataSource,
    schemaHost as unknown as GraphQLSchemaHost,
    httpAdapterHost as unknown as HttpAdapterHost,
  );

  beforeEach(() => {
    dataSource.query.mockReset();
    httpServer.listeners.mockReset();
    httpAdapterHost.httpAdapter = { getHttpServer: jest.fn(() => httpServer) };
    Object.defineProperty(schemaHost, 'schema', {
      configurable: true,
      get: () => schemaWithHealth('API is running'),
    });
    dataSource.query.mockResolvedValue([1]);
    httpServer.listeners.mockReturnValue([() => undefined]);
  });

  it('reports ok when the database, GraphQL, and WebSocket are up', async () => {
    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
      graphql: 'up',
      websocket: 'up',
    });
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    expect(httpServer.listeners).toHaveBeenCalledWith('upgrade');
  });

  it('reports the database down when the query fails', async () => {
    dataSource.query.mockRejectedValue(new Error('connection refused'));

    await expect(service.check()).resolves.toMatchObject({
      status: 'error',
      database: 'down',
      graphql: 'up',
      websocket: 'up',
    });
  });

  it('reports GraphQL down when the schema is not ready', async () => {
    Object.defineProperty(schemaHost, 'schema', {
      configurable: true,
      get() {
        throw new Error('schema is not ready');
      },
    });

    await expect(service.check()).resolves.toMatchObject({ status: 'error', graphql: 'down' });
  });

  it('reports GraphQL down when the health query fails', async () => {
    Object.defineProperty(schemaHost, 'schema', {
      configurable: true,
      get: () => schemaWithHealth(new Error('bad')),
    });

    await expect(service.check()).resolves.toMatchObject({ status: 'error', graphql: 'down' });
  });

  it('reports GraphQL down when the health field is not the API message', async () => {
    Object.defineProperty(schemaHost, 'schema', {
      configurable: true,
      get: () => schemaWithHealth('stopped'),
    });

    await expect(service.check()).resolves.toMatchObject({ status: 'error', graphql: 'down' });
  });

  it('reports WebSocket down when the upgrade listener is missing', async () => {
    httpServer.listeners.mockReturnValue([]);

    await expect(service.check()).resolves.toMatchObject({ status: 'error', websocket: 'down' });
  });

  it('reports WebSocket down when the HTTP server is unavailable', async () => {
    delete httpAdapterHost.httpAdapter;

    await expect(service.check()).resolves.toMatchObject({ status: 'error', websocket: 'down' });
  });

  it('reports WebSocket down when reading the server throws', async () => {
    httpAdapterHost.httpAdapter?.getHttpServer.mockImplementation(() => {
      throw new Error('missing server');
    });

    await expect(service.check()).resolves.toMatchObject({ status: 'error', websocket: 'down' });
  });
});
