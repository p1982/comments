import { join } from 'node:path';

import type { ApolloDriverConfig } from '@nestjs/apollo';
import type { ConfigService } from '@nestjs/config';

import { createGraphQLErrorFormatter } from '../common/filter/graphql-error.formatter';

export const buildGraphQLOptions = (config: ConfigService): ApolloDriverConfig => {
  const isProduction = config.get<string>('NODE_ENV') === 'production';

  return {
    autoSchemaFile: isProduction ? true : join(process.cwd(), 'apps/api/schema.gql'),
    sortSchema: true,
    playground: !isProduction,
    subscriptions: {
      'graphql-ws': true,
    },
    context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
    formatError: createGraphQLErrorFormatter(config),
  };
};
