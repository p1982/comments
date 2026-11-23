import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';

import { commentsListSchema, commentsSchema, commentsSearchSchema } from '@comments/shared';
import { AuthGuard, type RequestWithUser } from '@app/common/guards/auth.guard';
import { User } from '@app/common/pipes/user.pipe';
import { SearchService } from '@app/search/search.service';
import type { UsersEntity } from '@app/users/entity/users.entity';

import { CommentsService } from '../comments.service';
import { CommentPageType, CommentType } from './comment.type';
import { CommentsListInput } from './comments-list.input';
import { CreateCommentInput } from './create-comment.input';
import { fileUploadToMulter } from './to-multer-file';

@Resolver(() => CommentType)
export class CommentResolver {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly searchService: SearchService,
  ) {}

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
    @User() user: UsersEntity | null,
  ) {
    const { image, textFile, ...rest } = input;
    const body = commentsSchema.parse(rest);
    return await this.commentsService.createComment(
      body,
      ctx.req.cookies?.captcha ?? null,
      user,
      await fileUploadToMulter(image),
      await fileUploadToMulter(textFile),
    );
  }

  @Query(() => CommentPageType)
  searchComments(
    @Args('q') q: string,
    @Args('page', { nullable: true }) page?: number,
    @Args('limit', { nullable: true }) limit?: number,
  ) {
    return this.searchService.search(commentsSearchSchema.parse({ q, page, limit }));
  }
}
