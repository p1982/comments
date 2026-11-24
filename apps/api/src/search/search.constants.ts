import type { estypes } from '@elastic/elasticsearch';

export const COMMENTS_INDEX = 'comments_v2';
export const COMMENTS_REINDEX_BATCH_SIZE = 500;

export const COMMENTS_INDEX_SETTINGS: estypes.IndicesIndexSettings = {
  max_ngram_diff: 18,
  analysis: {
    filter: {
      substring_ngram: {
        type: 'ngram',
        min_gram: 2,
        max_gram: 20,
      },
    },
    analyzer: {
      substring_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'substring_ngram'],
      },
    },
  },
};

export const COMMENTS_INDEX_MAPPINGS: estypes.MappingTypeMapping = {
  properties: {
    id: { type: 'keyword' },
    parentId: { type: 'keyword' },
    username: {
      type: 'text',
      analyzer: 'standard',
      fields: {
        keyword: { type: 'keyword' },
        ngram: {
          type: 'text',
          analyzer: 'substring_analyzer',
          search_analyzer: 'standard',
        },
      },
    },
    plainText: {
      type: 'text',
      analyzer: 'standard',
      fields: {
        ngram: {
          type: 'text',
          analyzer: 'substring_analyzer',
          search_analyzer: 'standard',
        },
      },
    },
    createdAt: { type: 'date' },
  },
};
