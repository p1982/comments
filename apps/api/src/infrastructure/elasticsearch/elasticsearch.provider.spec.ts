jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

jest.mock('@elastic/elasticsearch', () => ({
  Client: jest.fn(),
}));

import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

import { elasticsearchProvider } from './elasticsearch.provider';

describe('elasticsearchProvider', () => {
  const ClientMock = Client as unknown as jest.Mock;

  beforeEach(() => {
    ClientMock.mockReset();
  });

  it('returns null when ELASTICSEARCH_NODE is missing', () => {
    const config = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    const factory = elasticsearchProvider.useFactory as (config: ConfigService) => Client | null;
    expect(factory(config)).toBeNull();
    expect(ClientMock).not.toHaveBeenCalled();
  });

  it('creates a client without auth when credentials are empty', () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'ELASTICSEARCH_NODE') return 'http://localhost:9200';
        return '';
      }),
    } as unknown as ConfigService;

    const factory = elasticsearchProvider.useFactory as (config: ConfigService) => Client | null;
    factory(config);

    expect(ClientMock).toHaveBeenCalledWith({ node: 'http://localhost:9200' });
  });

  it('creates a client with auth when username and password are set', () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'ELASTICSEARCH_NODE') return 'http://localhost:9200';
        if (key === 'ELASTICSEARCH_USERNAME') return 'elastic';
        if (key === 'ELASTICSEARCH_PASSWORD') return 'secret';
        return undefined;
      }),
    } as unknown as ConfigService;

    const factory = elasticsearchProvider.useFactory as (config: ConfigService) => Client | null;
    factory(config);

    expect(ClientMock).toHaveBeenCalledWith({
      node: 'http://localhost:9200',
      auth: { username: 'elastic', password: 'secret' },
    });
  });
});
