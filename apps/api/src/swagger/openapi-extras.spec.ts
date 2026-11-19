import { WS_COMMENT_CREATED } from '@comments/shared';

import { mergeOpenApiExtras, openApiExtraPaths } from './openapi-extras';

describe('openapi extras', () => {
  it('documents graphql and websocket paths', () => {
    expect(openApiExtraPaths['/graphql'].post.tags).toEqual(['graphql']);
    expect(openApiExtraPaths['/socket.io'].get.tags).toEqual(['websocket']);
    expect(openApiExtraPaths['/socket.io'].get.description).toContain(WS_COMMENT_CREATED);
    expect(openApiExtraPaths['/graphql'].post.description).toContain('searchComments');
    expect(
      openApiExtraPaths['/graphql'].post.requestBody.content['application/json'].examples
        .searchComments.variables,
    ).toEqual({ q: 'nestjs', page: 1, limit: 25 });
  });

  it('merges extras into an existing OpenAPI document', () => {
    const document = {
      openapi: '3.0.0',
      info: { title: 'Comments API', version: '1' },
      paths: {
        '/api/v1/health': {
          get: { summary: 'health' },
        },
      },
      tags: [{ name: 'health' }],
    };

    const merged = mergeOpenApiExtras(document);
    const paths = merged.paths as Record<string, unknown>;

    expect(paths['/api/v1/health']).toBeDefined();
    expect(paths['/graphql']).toEqual(openApiExtraPaths['/graphql']);
    expect(paths['/socket.io']).toEqual(openApiExtraPaths['/socket.io']);
    expect((merged.tags as Array<{ name: string }> | undefined)?.map((tag) => tag.name)).toEqual(
      expect.arrayContaining(['health', 'graphql', 'websocket']),
    );
  });
});
