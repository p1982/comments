import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import {
  commentSortFields,
  commentSortOrders,
  commentsListSchema,
  commentsSchema,
  commentVoteSchema,
  CookiesName,
  ENDPOINTS,
  type CommentsListQuery,
  type CommentsResult,
  type CommentsSchema,
  type CommentVoteResult,
  type CommentVoteSchema,
  commentsSearchSchema,
  type CommentsSearchQuery,
} from '@comments/shared';
import { ZodValidationPipe } from '@app/common/pipes/validation.pipe';
import { User } from '@app/common/pipes/user.pipe';
import { buildBaseCookieOptions } from '@app/common/cookies/cookie-options';
import { AuthGuard, type RequestWithUser } from '@app/common/guards/auth.guard';
import { ERROR_MESSAGES } from '@app/common/filter/error-messages';
import type { UsersEntity } from '@app/users/entity/users.entity';
import { SearchService } from '@app/search/search.service';

import { CommentsService } from './comments.service';
import {
  CommentResponseDto,
  CommentVoteDto,
  CommentVoteResultDto,
} from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { buildVoterCookieOptions, resolveVoterKey } from './helpers/voter-key';

@ApiTags(ENDPOINTS.COMMENTS)
@Controller(ENDPOINTS.COMMENTS)
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly searchService: SearchService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard)
  @ApiCookieAuth(CookiesName.ACCESS_TOKEN)
  @ApiCookieAuth(CookiesName.CAPTCHA)
  @ApiOperation({
    summary: 'Create a comment',
    description: [
      'Creates a root comment (or a reply when `parentId` is set).',
      'Optional `access_token` cookie attaches the signed-in user; captcha cookie is required.',
      'Persists the comment (and optional text file) in one DB transaction and writes a `comment.created` outbox row.',
      'HTTP returns after the transaction commits and the list cache is invalidated; WebSocket broadcast and Elasticsearch index run asynchronously via the outbox publisher.',
      'Optional image: fitted in-request when `COMMENT_QUEUE_MODE=sync`, otherwise queued as `process-image`.',
      'Multipart fields: `image`, `textFile` (plus JSON/form fields from the body schema).',
    ].join(' '),
  })
  @ApiBody({ type: CreateCommentDto })
  @ApiCreatedResponse({
    type: CommentResponseDto,
    description:
      'Comment row as stored. Side effects (WS / cache / search) may still be in flight for ~1s.',
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'textFile', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 5 * 1024 * 1024,
          files: 2,
        },
      },
    ),
  )
  async createComment(
    @User() user: UsersEntity | null,
    @Req() request: RequestWithUser,
    @Body(new ZodValidationPipe(commentsSchema)) body: CommentsSchema,
    @UploadedFiles()
    files?: {
      image?: Express.Multer.File[];
      textFile?: Express.Multer.File[];
    },
    @Res({ passthrough: true }) response?: Response,
  ): Promise<CommentResponseDto> {
    const created = await this.commentsService.createComment(
      body,
      request.cookies?.captcha ?? null,
      user,
      files?.image?.[0],
      files?.textFile?.[0],
    );
    response?.clearCookie(CookiesName.CAPTCHA, buildBaseCookieOptions(undefined, request));
    return created;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get root comments' })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: { type: 'integer', minimum: 1, default: 1 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 25, default: 25 },
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    schema: { enum: [...commentSortFields], default: 'createdAt' },
  })
  @ApiQuery({
    name: 'order',
    required: false,
    schema: { enum: [...commentSortOrders], default: 'desc' },
  })
  @ApiOkResponse({ type: CommentResponseDto, isArray: true })
  getComments(
    @Query(new ZodValidationPipe(commentsListSchema)) query: CommentsListQuery,
    @User() user: UsersEntity | null = null,
    @Req() request?: RequestWithUser,
  ): Promise<CommentsResult> {
    const voterKey = resolveVoterKey(user, request?.cookies?.voter_id);
    return this.commentsService.getComments(query, voterKey);
  }

  @Get(ENDPOINTS.SEARCH)
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Search comments',
    description:
      'Full-text and substring search over plainText and author name via Elasticsearch, ' +
      'with automatic PostgreSQL ILIKE fallback when Elasticsearch is unavailable. ' +
      'Returns hydrated comments from Postgres. HTML tags are stripped into plainText for matching only.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search query (1–100 characters)',
    schema: { type: 'string', minLength: 1, maxLength: 100, example: 'nestjs' },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: { type: 'integer', minimum: 1, default: 1 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 25, default: 25 },
  })
  @ApiOkResponse({ type: CommentResponseDto, isArray: true })
  @ApiServiceUnavailableResponse({ description: ERROR_MESSAGES.searchUnavailable })
  searchComments(
    @Query(new ZodValidationPipe(commentsSearchSchema)) query: CommentsSearchQuery,
    @User() user: UsersEntity | null = null,
    @Req() request?: RequestWithUser,
  ): Promise<CommentsResult> {
    const voterKey = resolveVoterKey(user, request?.cookies?.voter_id);
    return this.searchService.search(query, voterKey);
  }

  @Post(`:id${ENDPOINTS.VOTE}`)
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Vote on a comment (like / dislike)',
    description:
      'Toggles an upvote (+1) or downvote (-1) for the signed-in user or guest voter cookie. ' +
      'Clicking the same vote again removes it; clicking the opposite switches it.',
  })
  @ApiParam({ name: 'id', description: 'Comment id' })
  @ApiBody({ type: CommentVoteDto })
  @ApiOkResponse({ type: CommentVoteResultDto })
  @ApiNotFoundResponse({ description: ERROR_MESSAGES.notFound })
  voteComment(
    @Param('id') id: string,
    @User() user: UsersEntity | null,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
    @Body(new ZodValidationPipe(commentVoteSchema)) body: CommentVoteSchema,
  ): Promise<CommentVoteResult> {
    let voterKey = resolveVoterKey(user, request.cookies?.voter_id);
    if (!voterKey) {
      const guestId = crypto.randomUUID();
      response.cookie(CookiesName.VOTER_ID, guestId, buildVoterCookieOptions(undefined, request));
      voterKey = `guest:${guestId}`;
    }

    return this.commentsService.voteComment(id, body.value, voterKey);
  }

  @Get(':rootId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get children comments by root id' })
  @ApiParam({ name: 'rootId', description: 'Root comment id' })
  @ApiOkResponse({ type: CommentResponseDto, isArray: true })
  getCommentsByRootId(
    @Param('rootId') rootId: string,
    @User() user: UsersEntity | null = null,
    @Req() request?: RequestWithUser,
  ): Promise<CommentsResult> {
    const voterKey = resolveVoterKey(user, request?.cookies?.voter_id);
    return this.commentsService.getCommentsByRootId(rootId, voterKey);
  }
}
