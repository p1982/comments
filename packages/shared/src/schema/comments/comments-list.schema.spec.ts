import { commentsListSchema } from './comments-list.schema.js';

describe('commentsListSchema', () => {
  it('fills the list defaults', () => {
    expect(commentsListSchema.parse({})).toEqual({
      page: 1,
      limit: 25,
      sort: 'createdAt',
      order: 'desc',
    });
  });

  it('coerces page and limit from query strings', () => {
    expect(
      commentsListSchema.parse({ page: '2', limit: '10', sort: 'email', order: 'asc' }),
    ).toEqual({
      page: 2,
      limit: 10,
      sort: 'email',
      order: 'asc',
    });
  });

  it('rejects a page below 1, a limit above 25, and an unknown sort', () => {
    expect(commentsListSchema.safeParse({ page: '0' }).success).toBe(false);
    expect(commentsListSchema.safeParse({ limit: '26' }).success).toBe(false);
    expect(commentsListSchema.safeParse({ sort: 'text' }).success).toBe(false);
  });
});
