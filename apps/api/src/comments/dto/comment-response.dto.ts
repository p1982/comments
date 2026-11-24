import { ApiProperty } from '@nestjs/swagger';

import type { CommentAttachments, CommentResponse } from '@comments/shared';
import type { UsersEntity } from '@app/users/entity/users.entity';

import type { CommentsEntity } from '../entity/comments.entity';

export class CommentAttachmentDto implements CommentAttachments {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  fileName!: string;

  @ApiProperty({ enum: ['image', 'text'] })
  fileType!: 'image' | 'text';

  @ApiProperty()
  mimeType!: string;

  @ApiProperty({ example: '/assets/uuid.png' })
  url!: string;
}

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

  @ApiProperty({ example: 0, required: false })
  repliesCount?: number;

  @ApiProperty({ type: [CommentAttachmentDto] })
  attachments!: CommentAttachments[];
}

export const toCommentResponse = (
  comment: CommentsEntity,
  user: UsersEntity,
  repliesCount = 0,
): CommentResponse => ({
  id: comment.id,
  text: comment.text,
  createdAt: comment.createdAt.toISOString(),
  fullName: user.fullName,
  email: user.email,
  homepage: user.homepage ?? '',
  parentId: comment.parentId,
  repliesCount,
  attachments: Array.isArray(comment.attachments)
    ? comment.attachments.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        fileType: file.file_type === 'text' ? 'text' : 'image',
        mimeType: file.mimeType,
        url: `/assets/${file.storageKey}`,
      }))
    : [],
});
