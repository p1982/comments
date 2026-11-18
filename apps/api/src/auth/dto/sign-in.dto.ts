import { ApiProperty } from '@nestjs/swagger';

import type { AuthSignInRequest } from '@comments/shared';

export class SignInDto implements AuthSignInRequest {
  @ApiProperty({ example: 'auth@example.com' })
  email!: string;

  @ApiProperty({ example: 'password123' })
  password!: string;
}
