import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import type { FileUpload } from 'graphql-upload/processRequest.mjs';

@InputType()
export class CreateCommentInput {
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @Field()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  homepage?: string;

  @Field()
  @IsString()
  @MaxLength(10000)
  text!: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  captcha!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @Field(() => GraphQLUpload, { nullable: true })
  @IsOptional()
  image?: Promise<FileUpload>;

  @Field(() => GraphQLUpload, { nullable: true })
  @IsOptional()
  textFile?: Promise<FileUpload>;
}
