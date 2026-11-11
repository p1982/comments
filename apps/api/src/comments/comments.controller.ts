import { commentsSchema, ENDPOINTS, type CommentsSchema } from '@comments/shared';
import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

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
}
