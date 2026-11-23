import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Ann2', minLength: 2, maxLength: 100 })
  fullName!: string;

  @ApiProperty({ example: 'ann@example.com', maxLength: 255 })
  email!: string;

  @ApiPropertyOptional({
    example: '3f1c0b4e-8a2d-4c5b-9e1f-6a7b8c9d0e1f',
    description: 'Parent comment id. Omit this field for a root comment.',
  })
  parentId?: string;

  @ApiPropertyOptional({ example: 'https://ann.example', maxLength: 500 })
  homepage?: string;

  @ApiProperty({ example: 'Hello <strong>world</strong>', maxLength: 10000 })
  text!: string;
}
