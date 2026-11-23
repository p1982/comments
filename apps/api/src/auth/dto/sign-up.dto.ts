import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { AuthSignUpRequest } from '@comments/shared';

export class SignUpDto implements AuthSignUpRequest {
  @ApiProperty({ example: 'Ann' })
  fullName!: string;

  @ApiProperty({ example: 'auth@example.com' })
  email!: string;

  @ApiProperty({ example: 'password123' })
  password!: string;

  @ApiPropertyOptional({ example: 'https://ann.example' })
  homepage?: string;
}
