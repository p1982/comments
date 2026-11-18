import type { CommentsListQuery } from '@comments/shared';

import { COMMENTS_LIST_CACHE_PREFIX } from '../comments.constants';

export function commentsListCacheKey(query: CommentsListQuery, version = 0): string {
  return `${COMMENTS_LIST_CACHE_PREFIX}v${String(version)}:${String(query.page)}:${String(query.limit)}:${query.sort}:${query.order}`;
}
