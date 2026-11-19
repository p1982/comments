import { CookiesName, WS_COMMENT_CREATED } from '@comments/shared';

const graphqlQueryExamples = {
  health: {
    summary: 'Health probe',
    value: { query: 'query { health }' },
  },
  comments: {
    summary: 'List root comments',
    value: {
      query: `query Comments($input: CommentsListInput) {
  comments(input: $input) {
    data { id text fullName email createdAt parentId attachments { id url fileType } }
    total totalPages status message
  }
}`,
      variables: { input: { page: 1, limit: 25, sort: 'createdAt', order: 'desc' } },
    },
  },
  commentChildren: {
    summary: 'List replies under a root comment',
    value: {
      query: `query CommentChildren($rootId: String!) {
  commentChildren(rootId: $rootId) {
    data { id text parentId fullName }
    total totalPages
  }
}`,
      variables: { rootId: '3f1c0b4e-8a2d-4c5b-9e1f-6a7b8c9d0e1f' },
    },
  },
  createComment: {
    summary: 'Create a comment (multipart GraphQL upload supported)',
    value: {
      query: `mutation CreateComment($input: CreateCommentInput!) {
  createComment(input: $input) {
    id text fullName email parentId
  }
}`,
      variables: {
        input: {
          fullName: 'Ann',
          email: 'ann@example.com',
          text: 'Hello',
          captcha: 'ABCDE',
        },
      },
    },
  },
  searchComments: {
    summary: 'Search comments via Elasticsearch',
    value: {
      query: `query SearchComments($q: String!, $page: Float, $limit: Float) {
  searchComments(q: $q, page: $page, limit: $limit) {
    data { id text fullName email createdAt parentId }
    total totalPages status message
  }
}`,
      variables: { q: 'nestjs', page: 1, limit: 25 },
    },
  },
};

export const openApiExtraPaths = {
  '/graphql': {
    post: {
      tags: ['graphql'],
      summary: 'GraphQL HTTP endpoint',
      description: [
        'Single HTTP entry for GraphQL. Playground is enabled outside production at `/graphql`.',
        '',
        '**Queries:** `health`, `comments`, `commentChildren`, `searchComments`',
        '**Mutations:** `createComment` (optional `access_token` cookie; captcha cookie required by business rules)',
        '**Uploads:** `image` / `textFile` via `graphql-upload` multipart',
        '**Subscriptions transport:** `graphql-ws` is enabled on the same GraphQL server',
      ].join('\n'),
      security: [{ [CookiesName.ACCESS_TOKEN]: [] }, { [CookiesName.CAPTCHA]: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['query'],
              properties: {
                query: { type: 'string' },
                operationName: { type: 'string', nullable: true },
                variables: { type: 'object', additionalProperties: true },
              },
            },
            examples: graphqlQueryExamples,
          },
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                operations: {
                  type: 'string',
                  description: 'JSON string with query/variables (graphql-upload)',
                },
                map: {
                  type: 'string',
                  description: 'JSON map of file keys to variable paths',
                },
                image: { type: 'string', format: 'binary' },
                textFile: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'GraphQL response envelope',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'object', additionalProperties: true, nullable: true },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        message: { type: 'string' },
                        extensions: {
                          type: 'object',
                          properties: { code: { type: 'string' } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/socket.io': {
    get: {
      tags: ['websocket'],
      summary: 'Socket.IO endpoint',
      description: [
        'Connect with a Socket.IO client (`io(API_ORIGIN, { withCredentials: true })`).',
        'Default Engine.IO path is `/socket.io`.',
        '',
        '**Server → client events**',
        `- \`${WS_COMMENT_CREATED}\` — payload matches REST comment response (new comment broadcast)`,
        '',
        'No client → server comment commands; the gateway only broadcasts after create.',
      ].join('\n'),
      parameters: [
        {
          name: 'EIO',
          in: 'query',
          required: true,
          schema: { type: 'string', example: '4' },
          description: 'Engine.IO protocol version',
        },
        {
          name: 'transport',
          in: 'query',
          required: true,
          schema: { type: 'string', enum: ['polling', 'websocket'], example: 'websocket' },
        },
      ],
      responses: {
        '200': {
          description: 'Socket.IO / Engine.IO handshake (polling) or upgrade to WebSocket',
        },
        '101': {
          description: 'Switching Protocols when using the websocket transport',
        },
      },
    },
  },
} as const;

export const mergeOpenApiExtras = <T extends { paths?: object; tags?: object[] }>(
  document: T,
): T => ({
  ...document,
  tags: [
    ...((document.tags as Array<{ name: string; description?: string }> | undefined) ?? []),
    { name: 'graphql', description: 'GraphQL HTTP (+ graphql-ws subscriptions)' },
    { name: 'websocket', description: 'Socket.IO realtime comments' },
  ],
  paths: {
    ...(document.paths as Record<string, unknown>),
    ...openApiExtraPaths,
  },
});
