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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

import {
  commentSortFields,
  commentSortOrders,
  commentsListSchema,
  commentsSchema,
  CookiesName,
  ENDPOINTS,
  type CommentsListQuery,
  type CommentsResult,
  type CommentsSchema,
  commentsSearchSchema,
  type CommentsSearchQuery,
} from '@comments/shared';
import { ZodValidationPipe } from '@app/common/pipes/validation.pipe';
import { User } from '@app/common/pipes/user.pipe';
import { AuthGuard, type RequestWithUser } from '@app/common/guards/auth.guard';
import type { UsersEntity } from '@app/users/entity/users.entity';
import { SearchService } from '@app/search/search.service';

import { CommentsService } from './comments.service';
import { CommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

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
    description:
      'Creates a root comment. Pass parentId to reply to any comment. The access_token cookie attaches the signed-in user when it is present. Captcha cookie is required.',
  })
  @ApiBody({ type: CreateCommentDto })
  @ApiCreatedResponse({ type: CommentResponseDto })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'textFile', maxCount: 1 },
    ]),
  )
  createComment(
    @User() user: UsersEntity | null,
    @Req() request: RequestWithUser,
    @Body(new ZodValidationPipe(commentsSchema)) body: CommentsSchema,
    @UploadedFiles()
    files?: {
      image?: Express.Multer.File[];
      textFile?: Express.Multer.File[];
    },
  ): Promise<CommentResponseDto> {
    return this.commentsService.createComment(
      body,
      request.cookies?.captcha ?? null,
      user,
      files?.image?.[0],
      files?.textFile?.[0],
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
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
  ): Promise<CommentsResult> {
    return this.commentsService.getComments(query);
  }

  @Get(ENDPOINTS.SEARCH)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search comments',
    description:
      'Full-text search over comment content and author name via Elasticsearch. ' +
      'Returns hydrated comments from Postgres in hit order. HTML tags are stripped for matching only.',
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
  searchComments(
    @Query(new ZodValidationPipe(commentsSearchSchema)) query: CommentsSearchQuery,
  ): Promise<CommentsResult> {
    return this.searchService.search(query);
  }

  @Get(':rootId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get children comments by root id' })
  @ApiParam({ name: 'rootId', description: 'Root comment id' })
  @ApiOkResponse({ type: CommentResponseDto, isArray: true })
  getCommentsByRootId(@Param('rootId') rootId: string): Promise<CommentsResult> {
    return this.commentsService.getCommentsByRootId(rootId);
  }
}
