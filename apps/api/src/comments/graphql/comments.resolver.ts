import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';

import { commentsListSchema, commentsSchema } from '@comments/shared';
import { AuthGuard, type RequestWithUser } from '@app/common/guards/auth.guard';

import { CommentsService } from '../comments.service';
import { CommentPageType, CommentType } from './comment.type';
import { CommentsListInput } from './comments-list.input';
import { CreateCommentInput } from './create-comment.input';
import { fileUploadToMulter } from './to-multer-file';

@Resolver(() => CommentType)
export class CommentResolver {
  constructor(private readonly commentsService: CommentsService) {}

  @Query(() => CommentPageType)
  comments(@Args('input', { nullable: true }) input?: CommentsListInput) {
    const query = commentsListSchema.parse(input ?? {});
    return this.commentsService.getComments(query);
  }

  @Query(() => CommentPageType)
  commentChildren(@Args('rootId') rootId: string) {
    return this.commentsService.getCommentsByRootId(rootId);
  }

  @Mutation(() => CommentType)
  @UseGuards(AuthGuard)
  async createComment(
    @Args('input') input: CreateCommentInput,
    @Context() ctx: { req: RequestWithUser },
  ) {
    const { image, textFile, ...rest } = input;
    const body = commentsSchema.parse(rest);
    return await this.commentsService.createComment(
      body,
      ctx.req.cookies?.captcha ?? null,
      ctx.req.user ?? null,
      await fileUploadToMulter(image),
      await fileUploadToMulter(textFile),
    );
  }
}
