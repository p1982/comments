import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

import { ELASTICSEARCH_CLIENT } from './elasticsearch.constants';

export const elasticsearchProvider: Provider = {
  provide: ELASTICSEARCH_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Client | null => {
    const node = config.get<string>('ELASTICSEARCH_NODE');
    if (!node) {
      return null;
    }

    const username = config.get<string>('ELASTICSEARCH_USERNAME');
    const password = config.get<string>('ELASTICSEARCH_PASSWORD');

    return new Client({
      node,
      ...(username && password ? { auth: { username, password } } : {}),
    });
  },
};
