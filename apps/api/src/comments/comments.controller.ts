import {
  commentSortFields,
  commentSortOrders,
  commentsListSchema,
  commentsSchema,
  ENDPOINTS,
  type CommentsListQuery,
  type CommentsSchema,
} from '@comments/shared';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { ZodValidationPipe } from '@app/common/pipes/validation.pipe';

import { CommentsService } from './comments.service';
import { CommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuthGuard, type RequestWithUser } from '@app/common/guards/auth.guard';

@ApiTags(ENDPOINTS.COMMENTS)
@Controller(ENDPOINTS.COMMENTS)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({
    summary: 'Create a comment',
    description:
      'Creates a root comment. Pass parentId to reply to any comment. The access_token cookie attaches the signed-in user when it is present.',
  })
  @ApiBody({ type: CreateCommentDto })
  @ApiCreatedResponse({ type: CommentResponseDto })
  createComment(
    @Req() request: RequestWithUser,
    @Body(new ZodValidationPipe(commentsSchema)) body: CommentsSchema,
  ): Promise<CommentResponseDto> {
    return this.commentsService.createComment(body, request.user ?? null);
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
  ): Promise<CommentResponseDto[]> {
    return this.commentsService.getComments(query);
  }
}
