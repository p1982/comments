import { ApiProperty } from '@nestjs/swagger';

import type {
  CommentAttachments,
  CommentResponse,
  CommentVoteResult,
  CommentVoteValue,
  UserVoteValue,
} from '@comments/shared';
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

  @ApiProperty({ example: 0, required: false })
  votesScore?: number;

  @ApiProperty({ enum: [-1, 0, 1], example: 0, required: false })
  userVote?: UserVoteValue;

  @ApiProperty({ type: [CommentAttachmentDto] })
  attachments!: CommentAttachments[];
}

export class CommentVoteDto {
  @ApiProperty({ enum: [-1, 1], example: 1 })
  value!: CommentVoteValue;
}

export class CommentVoteResultDto implements CommentVoteResult {
  @ApiProperty({ format: 'uuid' })
  commentId!: string;

  @ApiProperty({ example: 1 })
  votesScore!: number;

  @ApiProperty({ enum: [-1, 0, 1], example: 1 })
  userVote!: UserVoteValue;
}

export const toCommentResponse = (
  comment: CommentsEntity,
  user: UsersEntity,
  repliesCount = 0,
  userVote: UserVoteValue = 0,
): CommentResponse => ({
  id: comment.id,
  text: comment.text,
  createdAt: comment.createdAt.toISOString(),
  fullName: user.fullName,
  email: user.email,
  homepage: user.homepage ?? '',
  parentId: comment.parentId,
  repliesCount,
  votesScore: Number.isFinite(comment.votesScore) ? comment.votesScore : 0,
  userVote,
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
