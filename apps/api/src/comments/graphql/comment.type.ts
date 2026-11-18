import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CommentAttachmentType {
  @Field() id!: string;
  @Field() fileName!: string;
  @Field() fileType!: string;
  @Field() mimeType!: string;
  @Field() url!: string;
}

@ObjectType()
export class CommentType {
  @Field() id!: string;
  @Field() text!: string;
  @Field() createdAt!: string;
  @Field() fullName!: string;
  @Field() email!: string;
  @Field() homepage!: string;
  @Field(() => String, { nullable: true }) parentId!: string | null;
  @Field(() => [CommentAttachmentType]) attachments!: CommentAttachmentType[];
}

@ObjectType()
export class CommentPageType {
  @Field(() => [CommentType]) data!: CommentType[];
  @Field(() => Int, { nullable: true }) total?: number;
  @Field(() => Int, { nullable: true }) totalPages?: number;
  @Field() status!: string;
  @Field() message!: string;
}
