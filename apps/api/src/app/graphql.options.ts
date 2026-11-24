import { join } from 'node:path';

import type { ApolloDriverConfig } from '@nestjs/apollo';
import type { ConfigService } from '@nestjs/config';

import { createGraphQLErrorFormatter } from '../common/filter/graphql-error.formatter';

const resolvePlaygroundEnabled = (config: ConfigService): boolean => {
  const flag = config.get<string>('GRAPHQL_PLAYGROUND')?.trim().toLowerCase();
  if (flag === 'false' || flag === '0') {
    return false;
  }
  return true;
};

export const buildGraphQLOptions = (config: ConfigService): ApolloDriverConfig => {
  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const enablePlayground = resolvePlaygroundEnabled(config);

  return {
    autoSchemaFile: isProduction ? true : join(process.cwd(), 'apps/api/schema.gql'),
    sortSchema: true,
    introspection: enablePlayground,
    playground: enablePlayground
      ? {
          settings: {
            'request.credentials': 'include',
          },
        }
      : false,
    subscriptions: {
      'graphql-ws': true,
    },
    context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
    formatError: createGraphQLErrorFormatter(config),
  };
};
