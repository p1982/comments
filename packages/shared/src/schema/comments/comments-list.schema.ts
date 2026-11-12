import { z } from 'zod';

import { commentSortFields, commentSortOrders } from '../../dto/comment.dto.js';

export const commentsListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(25).default(25),
  sort: z.enum(commentSortFields).default('createdAt'),
  order: z.enum(commentSortOrders).default('desc'),
});

export type CommentsListQuery = z.infer<typeof commentsListSchema>;
