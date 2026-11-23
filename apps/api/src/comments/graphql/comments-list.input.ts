import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

import { commentSortFields, commentSortOrders } from '@comments/shared';

@InputType()
export class CommentsListInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(25)
  limit?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn([...commentSortFields])
  sort?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn([...commentSortOrders])
  order?: string;
}
