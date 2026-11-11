import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Ann2', minLength: 2, maxLength: 100 })
  fullName!: string;

  @ApiProperty({ example: 'ann@example.com', maxLength: 255 })
  email!: string;

  @ApiPropertyOptional({ example: 'https://ann.example', maxLength: 500 })
  homepage?: string;

  @ApiProperty({ example: 'Hello <strong>world</strong>', maxLength: 10000 })
  text!: string;
}
