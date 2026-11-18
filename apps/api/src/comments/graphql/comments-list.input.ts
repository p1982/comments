import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CommentsListInput {
  @Field(() => Int, { nullable: true }) page?: number;
  @Field(() => Int, { nullable: true }) limit?: number;
  @Field({ nullable: true }) sort?: string;
  @Field({ nullable: true }) order?: string;
}
