import {
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
import { GetCommentsDto } from './dto/get-comments.dto';
import { AuthGuard, type RequestWithUser } from '@app/common/guards/auth.guard';

@ApiTags(ENDPOINTS.COMMENTS)
@Controller(ENDPOINTS.COMMENTS)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a root comment' })
  @ApiBody({ type: CreateCommentDto })
  @ApiCreatedResponse({ type: CommentResponseDto })
  @UseGuards(AuthGuard)
  createComment(
    @Req() request: RequestWithUser,
    @Body(new ZodValidationPipe(commentsSchema)) body: CommentsSchema,
  ): Promise<CommentResponseDto> {
    return this.commentsService.createComment(body, request.user ?? null);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get root comments' })
  @ApiQuery({ type: GetCommentsDto })
  @ApiOkResponse({ type: CommentResponseDto, isArray: true })
  getComments(
    @Query(new ZodValidationPipe(commentsListSchema)) query: CommentsListQuery,
  ): Promise<CommentResponseDto[]> {
    return this.commentsService.getComments(query);
  }
}
