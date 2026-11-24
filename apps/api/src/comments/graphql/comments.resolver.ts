import { UseGuards } from '@nestjs/common';
import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Response } from 'express';

import {
  commentsListSchema,
  commentsSchema,
  commentsSearchSchema,
  commentVoteSchema,
  CookiesName,
} from '@comments/shared';
import { AuthGuard, type RequestWithUser } from '@app/common/guards/auth.guard';
import { User } from '@app/common/pipes/user.pipe';
import { SearchService } from '@app/search/search.service';
import type { UsersEntity } from '@app/users/entity/users.entity';

import { CommentsService } from '../comments.service';
import { buildVoterCookieOptions, resolveVoterKey } from '../helpers/voter-key';
import { CommentPageType, CommentType, CommentVoteResultType } from './comment.type';
import { CommentsListInput } from './comments-list.input';
import { CreateCommentInput } from './create-comment.input';
import { fileUploadToMulter } from './to-multer-file';

interface GqlContext {
  req?: RequestWithUser;
  res?: Response;
}

@Resolver(() => CommentType)
export class CommentResolver {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly searchService: SearchService,
  ) {}

  @Query(() => CommentPageType)
  @UseGuards(AuthGuard)
  comments(
    @Args('input', { nullable: true }) input?: CommentsListInput,
    @Context() ctx?: GqlContext,
    @User() user: UsersEntity | null = null,
  ) {
    const query = commentsListSchema.parse(input ?? {});
    const voterKey = resolveVoterKey(user, ctx?.req?.cookies?.voter_id);
    return this.commentsService.getComments(query, voterKey);
  }

  @Query(() => CommentPageType)
  @UseGuards(AuthGuard)
  commentChildren(
    @Args('rootId') rootId: string,
    @Context() ctx?: GqlContext,
    @User() user: UsersEntity | null = null,
  ) {
    const voterKey = resolveVoterKey(user, ctx?.req?.cookies?.voter_id);
    return this.commentsService.getCommentsByRootId(rootId, voterKey);
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

  @Mutation(() => CommentVoteResultType)
  @UseGuards(AuthGuard)
  voteComment(
    @Args('commentId') commentId: string,
    @Args('value', { type: () => Int }) value: number,
    @Context() ctx: GqlContext,
    @User() user: UsersEntity | null,
  ) {
    const parsed = commentVoteSchema.parse({ value });
    let voterKey = resolveVoterKey(user, ctx.req?.cookies?.voter_id);
    if (!voterKey) {
      const guestId = crypto.randomUUID();
      ctx.res?.cookie(CookiesName.VOTER_ID, guestId, buildVoterCookieOptions(undefined, ctx.req));
      voterKey = `guest:${guestId}`;
    }
    return this.commentsService.voteComment(commentId, parsed.value, voterKey);
  }

  @Query(() => CommentPageType)
  @UseGuards(AuthGuard)
  searchComments(
    @Args('q') q: string,
    @Args('page', { nullable: true }) page?: number,
    @Args('limit', { nullable: true }) limit?: number,
    @Context() ctx?: GqlContext,
    @User() user: UsersEntity | null = null,
  ) {
    const voterKey = resolveVoterKey(user, ctx?.req?.cookies?.voter_id);
    return this.searchService.search(commentsSearchSchema.parse({ q, page, limit }), voterKey);
  }
}
