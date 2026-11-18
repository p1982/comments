import { Field, InputType } from '@nestjs/graphql';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import type { FileUpload } from 'graphql-upload/processRequest.mjs';

@InputType()
export class CreateCommentInput {
  @Field() fullName!: string;
  @Field() email!: string;
  @Field({ nullable: true }) homepage?: string;
  @Field() text!: string;
  @Field() captcha!: string;
  @Field(() => String, { nullable: true }) parentId?: string | null;
  @Field(() => GraphQLUpload, { nullable: true }) image?: Promise<FileUpload>;
  @Field(() => GraphQLUpload, { nullable: true }) textFile?: Promise<FileUpload>;
}
