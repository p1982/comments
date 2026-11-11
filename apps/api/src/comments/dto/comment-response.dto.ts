import { ApiProperty } from '@nestjs/swagger';

import type { CommentResponse } from '@comments/shared';
import type { CommentsEntity } from '../entity/comments.entity';
import type { UsersEntity } from '@app/users/entity/users.entity';

export class CommentResponseDto implements CommentResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ example: 'Ann2' })
  fullName!: string;

  @ApiProperty({ example: 'ann@example.com' })
  email!: string;

  @ApiProperty({ example: 'https://ann.example' })
  homepage!: string;

  @ApiProperty({ type: String, nullable: true })
  parentId!: string | null;
}

export const toCommentResponse = (comment: CommentsEntity, user: UsersEntity): CommentResponse => ({
  id: comment.id,
  text: comment.text,
  createdAt: comment.createdAt.toISOString(),
  fullName: user.fullName,
  email: user.email,
  homepage: user.homepage ?? '',
  parentId: comment.parentId,
});
