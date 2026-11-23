import { ApiProperty } from '@nestjs/swagger';

import type { AuthStatusResponse } from '@comments/shared';

export class AuthStatusDto implements AuthStatusResponse {
  @ApiProperty({ example: 'success' })
  status!: string;
}
