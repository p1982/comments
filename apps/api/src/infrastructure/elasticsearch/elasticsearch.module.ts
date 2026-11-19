import { Module } from '@nestjs/common';

import { elasticsearchProvider } from './elasticsearch.provider';

@Module({
  providers: [elasticsearchProvider],
  exports: [elasticsearchProvider],
})
export class ElasticsearchModule {}
