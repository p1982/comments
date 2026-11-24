import { z } from 'zod';

export const commentVoteValues = [-1, 1] as const;

export type CommentVoteValue = (typeof commentVoteValues)[number];
export type UserVoteValue = -1 | 0 | 1;

export const commentVoteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)]),
});

export type CommentVoteSchema = z.infer<typeof commentVoteSchema>;
