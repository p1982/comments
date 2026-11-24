import { commentVoteSchema } from './comment-vote.schema.js';

describe('commentVoteSchema', () => {
  it('accepts upvote (1) and downvote (-1)', () => {
    expect(commentVoteSchema.parse({ value: 1 })).toEqual({ value: 1 });
    expect(commentVoteSchema.parse({ value: -1 })).toEqual({ value: -1 });
  });

  it('rejects invalid vote values', () => {
    expect(() => commentVoteSchema.parse({ value: 0 })).toThrow();
    expect(() => commentVoteSchema.parse({ value: 2 })).toThrow();
    expect(() => commentVoteSchema.parse({ value: '1' })).toThrow();
  });
});
