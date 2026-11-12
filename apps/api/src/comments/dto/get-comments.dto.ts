import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  commentSortFields,
  commentSortOrders,
  type CommentSortField,
  type CommentSortOrder,
  type GetCommentsQuery,
} from '@comments/shared';

export class GetCommentsDto implements GetCommentsQuery {
  @ApiPropertyOptional({ type: Number, minimum: 1, default: 1, example: 1 })
  page?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, default: 25, example: 25 })
  limit?: number;

  @ApiPropertyOptional({ enum: commentSortFields, default: 'createdAt' })
  sort?: CommentSortField;

  @ApiPropertyOptional({ enum: commentSortOrders, default: 'desc' })
  order?: CommentSortOrder;
}
