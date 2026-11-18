import { join } from 'node:path';

import type { ApolloDriverConfig } from '@nestjs/apollo';
import type { ConfigService } from '@nestjs/config';

import { createGraphQLErrorFormatter } from '../common/filter/graphql-error.formatter';

export const buildGraphQLOptions = (config: ConfigService): ApolloDriverConfig => ({
  autoSchemaFile: join(process.cwd(), 'apps/api/schema.gql'),
  sortSchema: true,
  playground: config.get<string>('NODE_ENV') !== 'production',
  subscriptions: {
    'graphql-ws': true,
  },
  context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
  formatError: createGraphQLErrorFormatter(config),
});
