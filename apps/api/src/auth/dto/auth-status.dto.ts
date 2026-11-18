import { ApiProperty } from '@nestjs/swagger';

export class AuthStatusDto {
  @ApiProperty({ example: 'success' })
  status!: string;
}
