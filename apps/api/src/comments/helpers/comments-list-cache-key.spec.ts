import { commentsListCacheKey } from './comments-list-cache-key';

describe('commentsListCacheKey', () => {
  it('builds a versioned key from the list query', () => {
    expect(commentsListCacheKey({ page: 2, limit: 10, sort: 'email', order: 'asc' }, 4)).toBe(
      'comments:list:v4:2:10:email:asc',
    );
  });
});
