import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({ example: 'Ann' })
  fullName!: string;

  @ApiProperty({ example: 'auth@example.com' })
  email!: string;

  @ApiProperty({ example: 'password123' })
  password!: string;

  @ApiPropertyOptional({ example: 'https://ann.example' })
  homepage?: string;
}
