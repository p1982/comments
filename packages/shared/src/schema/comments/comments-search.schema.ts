import { z } from 'zod';

export const commentsSearchSchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, { message: 'Search query is required' })
    .max(100, { message: 'Search query must be less than 100 characters' }),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(25).default(25),
});

export type CommentsSearchQuery = z.infer<typeof commentsSearchSchema>;
